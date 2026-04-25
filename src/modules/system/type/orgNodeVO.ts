

export interface OrgNodeVO {
  id: string
  parentId: string
  name: string
  nodeType: number
  status?: number
  loginCode?: string
  sourceId?: string
  disabled?: boolean
  userCount?: number
  children?: OrgNodeVO[]
}
