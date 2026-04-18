import request from '@/utils/request'

// 混合树节点 VO
export interface OrgNodeVO {
  id: string           // 带有前缀的ID (如 D_1, U_5, E_ABC)
  parentId: string
  name: string
  nodeType: number     // 1: 部门, 2: 员工
  status?: number
  extCode?: string
  sourceId?: string
  disabled?: boolean
  children?: OrgNodeVO[]
}

// 请求入参 Record
export interface UserReq {
  id?: number          // 剥离前缀后的本地真实 ID (Long)
  deptId?: number
  status?: number
  newPasswordEnc?: string
  erpEmployeeTypeIds?: string[] // 剥离前缀后的 ERP typeId 集合
}

// 获取本地 部门-人员 树
export const getSystemUserTreeApi = () => {
  return request.post<any, OrgNodeVO[]>('/kaishi/system/user/tree/synced')
}

// 获取管家婆 未同步的 部门-人员 树
export const getErpUnsyncedUserTreeApi = () => {
  return request.post<any, OrgNodeVO[]>('/kaishi/system/user/tree/unsynced')
}

// 执行同步引入
export const syncUsersApi = (data: UserReq) => {
  return request.post('/kaishi/system/user/sync', data)
}

// 更新状态或部门
export const updateUserApi = (data: UserReq) => {
  return request.put('/kaishi/system/user/update', data)
}

// 重置密码
export const resetUserPwdApi = (data: UserReq) => {
  return request.put('/kaishi/system/user/reset/pwd', data)
}

// 删除本地用户
export const deleteUserApi = (id: number) => {
  return request.delete<any, string>(`/kaishi/system/user/delete/${id}`)
}
