// 商品属性信息 (对应 EdongfangProductParams)
import type {AncestorSubItem} from "@/modules/edongfang/product/type/ancestor/subItem.ts";

export interface ProductParamVO extends AncestorSubItem {
  pk?: string
  sku?: string
  name: string
  value: string
}
