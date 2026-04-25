export interface UserReq {
  id?: number
  deptId?: number
  status?: number
  newPasswordEnc?: string
  erpEmployeeTypeIds?: string[]
  roleIds?: number[]
}
