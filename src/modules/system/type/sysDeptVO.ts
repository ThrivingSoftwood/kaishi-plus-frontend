import index from "@/arch/request";

export interface SysDeptVO {
  id: number
  parentId: number
  ancestors: string
  deptName: string
  sortOrder: number
  status: number
  extInfo: string
  oriDepartmentTypeid: string
  children?: SysDeptVO[]
}
