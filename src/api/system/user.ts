import request from '@/utils/request'

// 混合树节点 VO
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

export interface UserReq {
  id?: number
  deptId?: number
  status?: number
  newPasswordEnc?: string
  erpEmployeeTypeIds?: string[]
  roleIds?: number[]
}

// 获取本地 部门-人员 树
export const getSystemUserTreeApi = () => {
  return request.post<any, OrgNodeVO[]>('/system/user/tree')
}

// 更新状态或部门
export const updateUserApi = (data: UserReq) => {
  return request.put('/system/user/update', data)
}

// 重置密码
export const resetUserPwdApi = (data: UserReq) => {
  return request.put('/system/user/reset/pwd', data)
}

// 删除本地用户
export const deleteUserApi = (id: number) => {
  return request.delete<any, string>(`/system/user/delete/${id}`)
}

export const getUserRolesApi = (userId: number) => {
  return request.get<any, number[]>(`/system/user/assigned-roles/${userId}`)
}

export const assignRolesToUserApi = (data: { id: number; roleIds: number[] }) => {
  return request.post<any, string>('/system/user/assign-roles', data, {
    // 🌟 同样需要加上请求头，触发后端立即刷新权限
    headers: { 'X-Update-Perm': 'true' }
  })
}

// ================== ERP 同步业务 (走 kaishi/sync) ==================
// 获取管家婆 未同步的 部门-人员 树
export const getErpUnsyncedUserTreeApi = () => {
  return request.post<any, OrgNodeVO[]>('/kaishi/sync/user/tree-unsynced')
}

// 执行同步引入
export const syncUsersApi = (data: any) => {
  return request.post('/kaishi/sync/user', data)
}
