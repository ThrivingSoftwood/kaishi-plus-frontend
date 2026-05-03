// 商品价格信息 (对应 EdongfangProductPrices)
import type {AncestorSubItem} from "@/modules/edongfang/product/type/ancestor/subItem.ts";

export interface ProductPriceVO extends AncestorSubItem {
  pk?: string
  sku?: string
  marketPrice?: number
  mallPrice?: number
  price?: number
  taxRate?: number
  nakedPrice?: number
  taxAmount?: number
}
