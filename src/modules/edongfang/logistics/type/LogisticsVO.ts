// 物流主表
export interface LogisticsVO {
  pk: string
  eOrderId: string
  logisticsState: number
  submitState: number
  packageId?: string
  orderPrice?: number
  orderType?: number
  expressCompany?: string
  expressNo?: string
  invoiceNo?: string
  invoiceCode?: string
  type?: number
  receiveTime?: string
  createTime?: string
  updateTime?: string
}
