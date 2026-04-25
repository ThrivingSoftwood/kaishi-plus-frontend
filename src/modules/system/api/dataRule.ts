import index from "@/arch/request";
import type {DataRuleReq} from "@/modules/system/type/dataRuleReq.ts";

export const getAllDataRulesApi = () => {
  return index.get<any, any[]>('/system/data-rule/all')
}

// 🌟 补全保存和删除接口
export const saveDataRuleApi = (data: DataRuleReq) => {
  return index.post('/system/data-rule/save', data)
}

export const deleteDataRuleApi = (id: number) => {
  return index.delete(`/system/data-rule/delete/${id}`)
}
