// src/api/purchase/trace.ts


// 3. API 调用方法
// 注意：由于你后端直接返回的是 List<DlyBuyVO>，所以泛型为 DlyBuyVO[]
import type {PurchaseOrderTraceDTO} from "@/modules/purchase/type/PurchaseOrderTraceDTO.ts";
import index from "@/arch/request";
import type {DlyBuyVO} from "@/modules/purchase/type/DlyBuyVO.ts";
import type {PurchaseTraceVO} from "@/modules/purchase/type/purchaseTraceVO.ts";
import type {ManualFinishReq} from "@/modules/purchase/type/manualFinishReq.ts";

export const getPurchaseListInfoApi = (data: PurchaseOrderTraceDTO) => {
  return index.post<any, DlyBuyVO[]>('/kaishi/purchase/trace/list/info', data)
}

// 获取具体单据的入库详情
export const getPurchaseDetailApi = (data: PurchaseOrderTraceDTO) => {
  return index.post<any, PurchaseTraceVO[]>('/kaishi/purchase/trace/list/detail', data)
}


/**
 * 手动置为完成 API
 */
export const manualFinishPurchaseApi = (data: ManualFinishReq) => {
  return index.post<any, any>('/kaishi/purchase/trace/manual/finish', data)
}
