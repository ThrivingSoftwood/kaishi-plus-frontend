import { defineStore } from 'pinia'
import { ref, h, defineComponent, defineAsyncComponent } from 'vue'
import { RouterView, type RouteRecordRaw } from 'vue-router'
import {useAuthStore} from "../auth/store/store.ts";
import Layout from '@/arch/layout/IndexView.vue'
import {getMenusApi, getPermissionTreeApi} from "@/modules/system/api/permission.ts";

const viewsModules = import.meta.glob('/src/**/view/**/*.vue')

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<any[]>([])
  const isRoutesLoaded = ref<boolean>(false)

  const generateRoutes = async () => {
    const authStore = useAuthStore()
    try {
      const res = await getPermissionTreeApi()
      const menuRes =  await getMenusApi(authStore.loginAccount)
      const rawMenus = menuRes || []

      // 🌟 核心修复 1：计算 fullPath，专供 Element Plus 侧边栏跳转使用
      const buildFullPath = (list: any[], basePath = '') => {
        list.forEach(item => {
          // 如果数据库存的是以 / 开头，说明是绝对路径；否则与父级路径拼接
          let currentPath = item.path.startsWith('/') ? item.path : `${basePath}/${item.path}`
          // 将可能出现的双斜杠 // 替换为单斜杠 /
          currentPath = currentPath.replace(/\/+/g, '/')

          // 将计算好的绝对路径挂载到对象上 (不修改原始 path)
          item.fullPath = currentPath

          if (item.children && item.children.length > 0) {
            buildFullPath(item.children, currentPath)
          }
        })
      }

      // 1. 生成侧边栏专用的 fullPath
      buildFullPath(rawMenus)
      menus.value = rawMenus

      // 2. 将后台菜单转化为 Vue 路由对象
      return transformMenuToRoute(menus.value)
    } catch (error) {
      console.error('动态路由生成失败', error)
      return []
    }
  }

  // 递归转换函数
  const transformMenuToRoute = (menuList: any[]): RouteRecordRaw[] => {
    return menuList.map(menu => {
      // 🌟 1. 解析 ext_info 中的自定义参数
      let extraMeta = {}
      try {
        if (menu.extInfo) {
          extraMeta = JSON.parse(menu.extInfo)
        }
      } catch (e) {
        console.warn(`解析权限节点 ${menu.permissionName} 的 extInfo 失败`, e)
      }

      const route: RouteRecordRaw = {
        // 🌟 核心修复 2：保持数据库原样！VueRouter 会自动进行相对路径的拼接！
        path: menu.path || menu.id.toString(),
        // 动态生成路由名称（保证唯一性）
        name: menu.permissionCode || menu.fullPath.replace(/\//g, '_').substring(1),
        meta: {
          title: menu.permissionName,
          icon: menu.icon,
          ...extraMeta
        },
        children: []
      }

      // 💡 组件挂载逻辑
      if (menu.permissionType === 1) {
        // 顶级目录挂载 Layout；次级目录挂载 RouterView 占位
        route.component = menu.parentId === 0
          ? Layout
          : () => Promise.resolve({ render: () => h(RouterView) })

      } else if (menu.permissionType === 2 && menu.component) {
        const safeComponent = menu.component.replace(/^\/+/, '')
        const componentPath = `/src/${safeComponent}.vue`

        const asyncImportFn = viewsModules[componentPath]

        if (asyncImportFn) {
          // 🌟 核心黑科技：给复用的组件穿上带名字的“马甲”
          // 1. 将动态导入转化为异步组件
          const AsyncComp = defineAsyncComponent(asyncImportFn as any)

          // 2. 在外层套一个空壳组件，强制其 name 与当前路由 name 完全一致
          route.component = defineComponent({
            name: route.name as string,
            render() {
              return h(AsyncComp)
            }
          })
        } else {
          console.error(`🚨 未找到前端组件... -> ${componentPath}`)
          route.component = () => import('@/shared/components/PlaceholderView.vue')
        }
      }

      // 🌟 递归处理子节点：只保留目录(1)和菜单(2)进入 Vue Router
      if (menu.children && menu.children.length > 0) {
        const validChildren = menu.children.filter((c: any) => [1, 2].includes(c.permissionType))
        if (validChildren.length > 0) {
          route.children = transformMenuToRoute(validChildren)
        }
      }

      return route
    })
  }

  const resetRouter = () => {
    menus.value = []
    isRoutesLoaded.value = false
  }

  return { menus, isRoutesLoaded, generateRoutes, resetRouter }
})
