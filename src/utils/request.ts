import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

export interface Result<T = any> {
  success: boolean; code: number; msg: string; data: T; timestamp: number
}

// 🌟 创建一个完全独立的 Axios 实例用于刷新 Token，防止被主拦截器死循环拦截
const refreshAxios = axios.create({ baseURL: '/api', timeout: 5000 })

let isRefreshing = false
let requestsQueue: (() => void)[] =[]

const request = axios.create({ baseURL: '/api', timeout: 10000 })

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const authStore = useAuthStore()

  // 🌟 如果正在刷新权限，且当前请求不是刷新请求，则挂起 Promise
  if (isRefreshing) {
    return new Promise(resolve => {
      requestsQueue.push(() => {
        // 刷新完毕后，塞入最新的 Token 并放行
        config.headers.set('Authorization', `Bearer ${authStore.token}`)
        resolve(config)
      })
    })
  }

  if (authStore.token) {
    config.headers.set('Authorization', `Bearer ${authStore.token}`)
  }
  return config
},
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  async (response: AxiosResponse<Result>) => {

    const authStore = useAuthStore()
    const res = response.data

    // 🌟 核心防线：捕获后端的静默刷新信号
    if (response.headers['x-update-perm'] === 'true') {
      if (!isRefreshing) {
        isRefreshing = true
        try {
          // 使用无拦截器的独立 axios 去发请求，携带旧 token
          const refreshRes = await refreshAxios.post('/kaishi/auth/refreshPerm', {}, {
            headers: { 'Authorization': `Bearer ${authStore.token}` }
          })
          if (refreshRes.data.success) {
            const { token, username, permissions, roleCodes } = refreshRes.data.data
            // 静默更新 Pinia 和 LocalStorage
            authStore.setAuthInfo(token, authStore.loginAccount, username, permissions, roleCodes)

            // 🌟 释放队列中被挂起的并发请求
            requestsQueue.forEach(callback => callback())
            requestsQueue =[]

            // 导师启发：如果用户的菜单权限被褫夺，你觉得这里需不需要调用 location.reload()？
            // 视业务严苛程度而定。通常数据列会自动被抹除，但左侧菜单最好提示用户刷新。
          }
        } catch (error) {
          ElMessage.error('权限同步失败，请重新登录')
          authStore.clearAuth()
          router.push({ name: 'Login' })
        } finally {
          isRefreshing = false
        }
      }
    }

    if (res.success !== undefined) {
      if (res.success) {
        return res.data // 直接返回 data 泛型对象
      } else {
        if (res.code === 401) {
          ElMessage.warning(res.msg || '登录已过期或未授权，请重新登录')

          // 🌟 核心修正：必须调用 store 的 clearAuth，确保 Pinia 内存和 LocalStorage 同步清空
          // 注意：useAuthStore() 必须在函数内部调用，防止在 Pinia 挂载前过早执行
          const authStore = useAuthStore()
          authStore.clearAuth()

          router.push({ name: 'Login' })
          return Promise.reject(new Error(res.msg || 'Error'))
        } else {
          ElMessage.error(res.msg || '系统异常')
          return Promise.reject(new Error(res.msg || 'Error'))
        }
      }
    }
    return res
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      ElMessage.warning('登录已过期或未授权，请重新登录')

      // 🌟 核心修正
      const authStore = useAuthStore()
      authStore.clearAuth()

      router.push({ name: 'Login' })
    } else {
      // 如果后端崩了返回了 HTML (Spring 默认错误页) 或者超长的数据库报错
      // 🌟 修复 JavaScript 陷阱：indexOf 未找到返回 -1，-1 为 true。必须使用 includes
      const isTimeout = error.message && error.message.includes('timeout of')
      const errorMsg = error.response?.data?.msg || (isTimeout ? "请求超时,请检查服务端与数据库是否正常!" : error.message);

      if (errorMsg && (errorMsg.includes('SQL') || errorMsg.includes('Exception'))) {
        ElMessage.error('系统底层响应异常，请联系管理员');
      } else {
        ElMessage.error(errorMsg || '未知错误');
      }
    }
    return Promise.reject(error)
  }
)

export default request
