import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
// 🌟 新增引入
import { useAuthStore } from '@/stores/auth'

// 定义后端通用返回结构
export interface Result<T = any> {
  success: boolean
  code: number
  msg: string
  data: T
  timestamp: number
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('kaishi_token')
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    const res = response.data
    if (res.success !== undefined) {
      if (res.success) {
        return res.data // 直接返回 data 泛型对象
      } else {
        if (res.code === 401) {
          ElMessage.warning('登录已过期或未授权，请重新登录')

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
