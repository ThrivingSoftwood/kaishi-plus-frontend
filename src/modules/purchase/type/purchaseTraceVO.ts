



// 对应后端的 PurchaseTraceVO
export interface PurchaseTraceVO {
  // 状态展示字段
  statusName: string
  statusTag: string
  owedQty: number

  // 采购计划信息 (A表核心)
  number: string
  summary: string
  aDate: string
  aVchcode: number
  aDlyOrder: number
  aBtypeidFullname: string
  aPtypeIdFullname: string
  aUnitName: string
  aQty: number
  aPrice: number
  aDiscounttotal: number
  aComment: string
  aRedOldName: string
  aEtypeidFullname: string
  aBlockno: string

  // 入库执行信息 (B表核心)
  bQty: number
  bDate: string
  bVchcode: number
  bDlyOrder: number
  bKtypeidFullname: string
}
