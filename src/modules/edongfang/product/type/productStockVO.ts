// 商品库存信息 (对应 EdongfangProductStocks)
import type {AncestorSubItem} from "@/modules/edongfang/product/type/ancestor/subItem.ts";

export interface ProductStockVO extends AncestorSubItem {
  pk?: string
  sku?: string
  num: number
  area: string
  desc: string // 有货/缺货
}
