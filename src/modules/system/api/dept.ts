import type {SysDeptVO} from "@/modules/system/type/sysDeptVO.ts";
import type {DepartmentReq} from "@/modules/system/type/departmentReq.ts";
import type {DepartmentVO} from "@/modules/system/type/departmentVO.ts";
import type {ErpSyncReq} from "@/modules/system/type/erpSyncReq.ts";
import index from "@/arch/request";


// 获取本地已同步的部门树
export const getSyncedDeptTreeApi = () => {
  return index.get<any, SysDeptVO[]>('/system/dept/tree')
}

// 快捷更新 (状态、排序)
export const updateDeptApi = (data: DepartmentReq) => {
  return index.post('/system/dept/update', data)
}

// 删除部门
export const deleteDeptApi = (data: DepartmentReq) => {
  return index.post<any, string>('/system/dept/delete', data)
}

// ================== ERP 同步业务 (走 kaishi/sync) ==================
// 获取管家婆未同步的部门树
export const getUnsyncedDeptTreeApi = () => {
  return index.get<any, DepartmentVO[]>('/kaishi/sync/dept/tree-unsynced')
}

// 执行同步
export const syncDepartmentsApi = (data: ErpSyncReq) => {
  return index.post('/kaishi/sync/dept', data)
}
