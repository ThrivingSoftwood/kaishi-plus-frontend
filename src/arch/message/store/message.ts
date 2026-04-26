import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { getUnreadCountApi } from '@/arch/message/api/message'
import { useAuthStore } from '@/arch/auth/store/store'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref<number>(0)

  // 维护原生的 EventSource 实例
  let eventSource: EventSource | null = null
  let reconnectTimer: any = null

  // 拉取初始未读数量
  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCountApi()
      unreadCount.value = res || 0
    } catch (error) {
      console.error('获取未读消息数失败', error)
    }
  }

  // 🚀 核心：建立 SSE 连接
  const connectSse = () => {
    const authStore = useAuthStore()
    if (!authStore.token) return

    // 如果已经有连接，先关掉，防止重复建立
    disconnectSse()

    // 注意：SSE 请求不会被 Axios 拦截器处理，因此这里需要写完整的带 /api 代理前缀的 URL
    const url = `/api/kaishi/message/subscribe?token=${authStore.token}`
    eventSource = new EventSource(url)

    // 1. 监听连接成功
    eventSource.onopen = () => {
      console.log('✅ SSE 实时消息通道已建立')
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    // 2. 监听自定义的 message 事件 (与后端 SseEmitter.event().name("message") 对应)
    eventSource.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data)

        // 数量 +1
        unreadCount.value++

        // 🌟 触发系统级气泡通知
        ElNotification({
          title: msg.title || '系统预警',
          message: msg.content || '您有一条新消息',
          // 根据类型赋予不同颜色：1-预警(黄), 2-通知(蓝)
          type: msg.msgType === 1 ? 'warning' : 'info',
          position: 'bottom-right',
          duration: 8000 // 显示 8 秒
        })
      } catch (e) {
        console.error('解析推送消息失败', e)
      }
    })

    // 3. 监听心跳 (静默处理，证明连接存活即可)
    eventSource.addEventListener('heartbeat', () => {
      // console.debug('💓 收到心跳包')
    })

    // 4. 监听断线与错误
    eventSource.onerror = (err) => {
      console.error('❌ SSE 连接异常断开，尝试重连...', err)
      eventSource?.close()

      // 自动重连机制 (指数退避或固定延迟，这里使用固定 5 秒重连)
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          connectSse()
        }, 5000)
      }
    }
  }

  // 手动断开连接 (退出登录时调用)
  const disconnectSse = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      console.log('🔌 SSE 实时通道已手动关闭')
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    connectSse,
    disconnectSse
  }
})
