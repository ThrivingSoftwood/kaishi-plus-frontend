import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../auth/store/store'
import {usePermissionStore} from "@/arch/router/dynamic.ts";
import Layout from '@/arch/layout/IndexView.vue'

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/shared/components/LoginView.vue')
  },
  {
    // 这个是基础 Layout，动态路由会作为它的 children 注入
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/placeholder',
    children: [
      {
        path: '/placeholder',
        name: 'Placeholder',
        component: () => import('@/shared/components/PlaceholderView.vue'),
        meta: { title: '欢迎页' }
      },
      // 🌟 将所有不需要在侧边栏显示的隐藏详情页写在这里！
      // 它们会继承 Layout，所以页面上方依然有面包屑，左侧依然有侧边栏
      {
        path: 'purchase/trace/detail/:vchcode/:dlyorder',
        name: 'TracePurchaseDetail',
        component: () => import('@/modules/purchase/view/trace/DetailView.vue'),
        meta: { title: '入库详情记录' }
      }
    ]
  },
  // 🌟 终极防白屏盾牌：通配符路由
  // pathMatch 是 Vue Router 4 的固定写法，用于捕获所有未定义的路径
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    // 这里可以选择跳转到 404 页面，或者是直接重定向到主页
    redirect: '/placeholder'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes
})

// 🌟 路由守卫：拦截与动态加载
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()
  const isLogin = authStore.isAuthenticated

  if (to.name === 'Login') {
    if (isLogin) {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (!isLogin) {
      // 未登录，拦截
      next({ name: 'Login' })
    } else {
      // 🌟 核心拦截逻辑：已登录，但动态路由还没加载
      if (!permissionStore.isRoutesLoaded) {
        // 1. 生成路由表
        const accessRoutes = await permissionStore.generateRoutes()

        // 2. 将生成的路由动态添加到 Vue Router 中
        // 挂载到 name='Layout' 的根路由下，这样它们就会在 <router-view> 中渲染
        accessRoutes.forEach(route => {
          // 如果是一级目录，因为我们刚才转换时已经给了 component: Layout
          // 所以直接 addRoute 即可
          router.addRoute(route)
        })

        // 3. 标记为已加载
        permissionStore.isRoutesLoaded = true

        // 4. 🚨 终极防坑：触发重定向，确保刚刚 addRoute 的地址能被正确解析
        // replace: true 确保浏览器历史记录不会多出一条奇怪的记录
        next({ ...to, replace: true })
      } else {
        // 路由已加载，正常放行
        next()
      }
    }
  }
})

export default router
