import request from '@/utils/request'

export interface DataRuleReq {
  id?: number | null
  targetResource: string
  ruleName: string
  scopeType: number
  customSqlJson: string
}

export const getAllDataRulesApi = () => {
  return request.get<any, any[]>('/system/data-rule/all')
}

// 🌟 补全保存和删除接口
export const saveDataRuleApi = (data: DataRuleReq) => {
  return request.post('/system/data-rule/save', data)
}

export const deleteDataRuleApi = (id: number) => {
  return request.delete(`/system/data-rule/delete/${id}`)
}
