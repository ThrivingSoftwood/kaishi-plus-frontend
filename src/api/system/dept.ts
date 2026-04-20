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
  synced: boolean
  children?: DepartmentVO[]
}

export interface DepartmentReq {
  id?: number
  sortOrder?: number
  status?: number
  typeIds?: string[]
}

// 🌟 新增：专门配合后端 ErpSyncReq 的接口
export interface ErpSyncReq {
  deptTypeIds?: string[]
  erpEmployeeTypeIds?: string[]
  newPasswordEnc?: string
}

// 获取本地已同步的部门树
export const getSyncedDeptTreeApi = () => {
  return request.get<any, SysDeptVO[]>('/system/dept/tree')
}

// 快捷更新 (状态、排序)
export const updateDeptApi = (data: DepartmentReq) => {
  return request.post('/system/dept/update', data)
}

// 删除部门
export const deleteDeptApi = (data: DepartmentReq) => {
  return request.post<any, string>('/system/dept/delete', data)
}

// ================== ERP 同步业务 (走 kaishi/sync) ==================
// 获取管家婆未同步的部门树
export const getUnsyncedDeptTreeApi = () => {
  return request.get<any, DepartmentVO[]>('/kaishi/sync/dept/tree-unsynced')
}

// 执行同步
export const syncDepartmentsApi = (data: ErpSyncReq) => {
  return request.post('/kaishi/sync/dept', data)
}
