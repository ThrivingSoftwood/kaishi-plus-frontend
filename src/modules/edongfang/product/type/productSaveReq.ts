// 全量聚合视图/请求体 (复用于详情回显和保存/更新接口)


import type {ProductVO} from "@/modules/edongfang/product/type/productVO.ts";
import type {ProductPriceVO} from "@/modules/edongfang/product/type/productPriceVO.ts";
import type {ProductImageVO} from "@/modules/edongfang/product/type/productImageVO.ts";
import type {ProductParamVO} from "@/modules/edongfang/product/type/productParamVO.ts";
import type {ProductStockVO} from "@/modules/edongfang/product/type/productStockVO.ts";

export interface ProductSaveReq {
  product: ProductVO | any
  prices: ProductPriceVO[]
  images: ProductImageVO[]
  params: ProductParamVO[]
  stocks: ProductStockVO[]
}
