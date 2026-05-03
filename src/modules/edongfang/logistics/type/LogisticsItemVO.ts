// 物流商品明细
export interface LogisticsItemVO {
  pk: string
  eOrderId: string
  sku: string
  num: number
  price: number
  signedCount?: number
  signedAmount?: number
}
