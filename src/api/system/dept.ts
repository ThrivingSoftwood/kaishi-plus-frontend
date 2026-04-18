import request from '@/utils/request'

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

export interface DepartmentVO {
  typeid: string
  parid: string
  fullName: string
  children?: DepartmentVO[]
}

export interface DepartmentReq {
  id?: number
  sortOrder?: number
  status?: number
  typeIds?: string[]
}

// 获取本地已同步的部门树
export const getSyncedDeptTreeApi = () => {
  return request.get<any, SysDeptVO[]>('/kaishi/system/dept/tree/synced')
}

// 获取管家婆未同步的部门树
export const getUnsyncedDeptTreeApi = () => {
  return request.get<any, DepartmentVO[]>('/kaishi/system/dept/tree/unsynced')
}

// 执行同步
export const syncDepartmentsApi = (data: DepartmentReq) => {
  return request.post('/kaishi/system/dept/sync', data)
}

// 快捷更新 (状态、排序)
export const updateDeptApi = (data: DepartmentReq) => {
  return request.post('/kaishi/system/dept/update', data)
}

// 删除部门
export const deleteDeptApi = (data: DepartmentReq) => {
  return request.post<any, string>('/kaishi/system/dept/delete', data)
}
