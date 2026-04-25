export interface DepartmentVO {
  typeid: string
  parid: string
  fullName: string
  synced: boolean
  children?: DepartmentVO[]
}
