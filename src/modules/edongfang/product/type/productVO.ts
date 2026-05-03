// 商品主表信息 (对应 EdongfangProducts)
export interface ProductVO {
  pk?: string
  sku: string
  url?: string
  model?: string
  weight: number
  imagePath: string // 主图
  state: number     // 1上架 0下架
  brandName: string
  name: string
  productArea: string
  upc?: string
  unit: string
  category: string
  categoryName: string
  service?: string
  introduction: string
  param?: string
  ware: string
  taxRate?: number
  taxCategoryCode?: string
  searchKeyword: string
  saleActives?: number
}
