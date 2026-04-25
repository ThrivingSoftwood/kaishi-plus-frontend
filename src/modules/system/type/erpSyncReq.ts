// 🌟 新增：专门配合后端 ErpSyncReq 的接口
export interface ErpSyncReq {
  deptTypeIds?: string[]
  erpEmployeeTypeIds?: string[]
  newPasswordEnc?: string
}
