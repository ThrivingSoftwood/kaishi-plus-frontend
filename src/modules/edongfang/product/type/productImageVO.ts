// 商品图片信息 (对应 EdongfangProductImages)
import type {AncestorSubItem} from "@/modules/edongfang/product/type/ancestor/subItem.ts";

export interface ProductImageVO extends AncestorSubItem {
  pk?: string
  sku?: string
  path: string
  order: number
}
