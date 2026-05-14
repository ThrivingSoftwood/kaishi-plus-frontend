// 分页查询请求参数
export interface ProductQueryReq {
  pageNo: number
  pageSize: number
  sku?: string
  name?: string
  productArea?: string
  minWeight?: number
  maxWeight? :number
}
