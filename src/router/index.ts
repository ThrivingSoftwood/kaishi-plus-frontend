import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {useAuthStore} from '@/stores/auth'
import Layout from '@/layout/IndexView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/',
    component: Layout, // 使用刚刚构建的带有侧边栏的布局
    redirect: '/placeholder',
    children: [
      {
        path: '/placeholder',
        name: 'Placeholder',
        component: () => import('@/views/PlaceholderView.vue'),
        meta: {title: '欢迎页'}
      },
      {
        path: 'trace/purchase/others',
        name: 'TraceUnfinishedPurchase',
        component: () => import('@/views/trace/purchase/IndexView.vue'),
        meta: {title: '其他采购单', queryPurchased: false}
      },
      {
        path: 'trace/purchase/finished',
        name: 'TraceFinishedPurchase',
        component: () => import('@/views/trace/purchase/IndexView.vue'),
        meta: {title: '已完成采购单', queryPurchased: true}
      },
      {
        // 动态路由：接收 vchcode 和 dlyorder
        path: 'trace/purchase/detail/:vchcode/:dlyorder',
        name: 'TracePurchaseDetail',
        component: () => import('@/views/trace/purchase/DetailView.vue'),
        meta: { title: '入库详情列表' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})


router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLogin = authStore.isAuthenticated

  // 1. 如果用户试图访问登录页
  if (to.name === 'Login') {
    if (isLogin) {
      // 🟢 场景 A：已登录，却通过 URL 手动访问 /login
      // 动作：拦截，并强制重定向到系统根路径（由路由表配置决定具体去哪）
      next({path: '/'})
    } else {
      // ⚪ 场景 B：未登录，正常访问 /login
      // 动作：放行
      next()
    }
  }
  // 2. 如果用户试图访问其他业务页面
  else {
    if (!isLogin) {
      // 🔴 场景 C：未登录，试图访问受保护的页面 (如 /trace/purchase/others)
      // 动作：拦截，强制打回登录页
      next({name: 'Login'})
    } else {
      // 🟢 场景 D：已登录，正常访问业务页面
      // 动作：正常放行
      next()
    }
  }
})

export default router
