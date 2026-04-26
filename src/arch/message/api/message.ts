import request from "@/arch/request";

/**
 * 消息中心 API
 */

// 获取未读消息总数
export const getUnreadCountApi = () => {
  return request.get<any, number>('/kaishi/message/unread-count')
}

// 分页获取历史消息
export const pageMessagesApi = (params: { pageNo: number; pageSize: number; readStatus?: number }) => {
  return request.get<any, any>('/kaishi/message/page', { params })
}

// 标记单条已读
export const markAsReadApi = (id: number) => {
  return request.put<any, void>(`/kaishi/message/read/${id}`)
}

// 全部一键已读
export const markAllAsReadApi = () => {
  return request.put<any, void>('/kaishi/message/read-all')
}
