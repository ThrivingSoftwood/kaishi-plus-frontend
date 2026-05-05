import {pageOrdersApi} from "@/modules/edongfang/order/api/order.ts";

export const buttonActionNameMap: Record<number, string> = {
  [5]: '订单发货',
  [-2]: '取消订单',
  [1]: '妥投完成'
}



// 🌟 动态获取挂起指令的操作名称
export const getPendingActionName = (status: number | null) => {
  if (status === null || status === undefined) return '业务'

  return buttonActionNameMap[status] || '状态变更'
}
