import request from '@/arch/request'
import type {LogisticsQueryReq} from "@/modules/edongfang/logistics/type/logisticsQueryReq.ts";
import type {LogisticsDetailVO} from "@/modules/edongfang/logistics/type/logisticsDetailVO.ts";

/**
 * 1. 分页查询发货信息
 */
export const pageLogisticsApi = (params: LogisticsQueryReq) => {
  return request.get<any, any>('/kaishi/edongfang/logistics/page', {params})
}

/**
 * 2. 获取物流发货全景详情
 */
export const getLogisticsDetailApi = (pk: string) => {
  return request.get<any, LogisticsDetailVO>(`/kaishi/edongfang/logistics/detail/${pk}`)
}
export const saveLogisticsApi = (data: any) => request.post<any, void>('/kaishi/edongfang/logistics/save', data)
export const updateLogisticsApi = (data: any) => request.put<any, void>('/kaishi/edongfang/logistics/update', data)
