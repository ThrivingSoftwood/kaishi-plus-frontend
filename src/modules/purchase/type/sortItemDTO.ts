
// 1. 请求参数 DTO (对应后端的 PurchaseOrderTraceDTO)
import index from "@/arch/request";

/**
 * 排序条件项接口 (对应 Java 中的 SortItemDTO)
 */
export interface SortItemDTO {
  field?: string;
  ascFlag?: boolean;
}
