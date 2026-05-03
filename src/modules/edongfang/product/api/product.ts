// src/modules/product/api/product.ts
import request from '@/arch/request'
import type {ProductQueryReq} from "@/modules/edongfang/product/type/productQueryReq.ts";
import type {ProductSaveReq} from "@/modules/edongfang/product/type/productSaveReq.ts";

/**
 * ==========================================
 * 📖 读操作 (Query)
 * ==========================================
 */

/**
 * 1. 获取商品分页列表
 * @param params 查询条件 (页码、条数、SKU、名称)
 */
export const pageProductsApi = (params: ProductQueryReq) => {
  return request.post<any, any>('/kaishi/edongfang/product/page', params)
}

/**
 * 2. 获取商品全景详情 (包含主信息、价格、图片、属性、库存)
 * @param sku 商品编号
 */
export const getProductDetailApi = (sku: string) => {
  // 返回值类型直接对标 ProductSaveReq 结构，方便表单直接回显
  return request.get<any, ProductSaveReq>(`/kaishi/edongfang/product/detail/${sku}`)
}

/**
 * ==========================================
 * ✍️ 写操作 (Command)
 * ==========================================
 */

/**
 * 3. 新增商品 (含一对多关联数据)
 * @param data 聚合数据体
 */
export const saveProductApi = (data: ProductSaveReq) => {
  return request.post<any, void>('/kaishi/edongfang/product/save', data)
}

/**
 * 4. 更新商品 (含一对多关联数据)
 * @param data 聚合数据体
 */
export const updateProductApi = (data: ProductSaveReq) => {
  return request.put<any, void>('/kaishi/edongfang/product/update', data)
}

/**
 * 5. 批量修改商品上下架状态
 * @param state 目标状态 (1:上架, 0:下架)
 * @param skus 选中的 SKU 数组
 */
export const changeProductStatusApi = (state: number, skus: string[]) => {
  return request.put<any, void>(`/kaishi/edongfang/product/state/${state}`, skus)
}
