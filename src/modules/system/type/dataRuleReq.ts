

export interface DataRuleReq {
  id?: number | null
  targetResource: string
  ruleName: string
  scopeType: number
  customSqlJson: string
}
