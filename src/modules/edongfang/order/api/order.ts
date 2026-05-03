import request from '@/arch/request'

export const pageOrdersApi = (params: any) => request.get<any, any>('/kaishi/edongfang/order/page', {params})
export const getOrderDetailApi = (eOrderId: string) => request.get<any, any>(`/kaishi/edongfang/order/detail/${eOrderId}`)
export const getOrderItemApi = (pk: string) => request.get<any, any>(`/kaishi/edongfang/order/item-detail/${pk}`)

export const cancelOrdersApi = (data: {
  eOrderIds: string[]
}) => request.put<any, void>('/kaishi/edongfang/order/cancel', data)
export const deliverOrdersApi = (data: {
  eOrderIds: string[]
}) => request.put<any, void>('/kaishi/edongfang/order/deliver', data)
export const shipOrdersApi = (data: {
  eOrderIds: string[]
}) => request.put<any, void>('/kaishi/edongfang/order/ship', data)
