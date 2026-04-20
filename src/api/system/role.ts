// File: ./src/api/system/role.ts
import request from '@/utils/request'

// 定义更新权限的特征请求头常量
const PERM_UPDATE_HEADER = { 'X-Update-Perm': 'true' }

/**
 * 获取角色列表 (仅查询，无需请求头)
 */
export const getRolesApi = () => {
  return request.get<any, any[]>('/system/role/list')
}

/**
 * 保存或新增角色 (涉及角色编码/状态变更，增加请求头)
 */
export const saveRoleApi = (data: any) => {
  return request.post<any, string>('/system/role/save', data, {
    headers: PERM_UPDATE_HEADER
  })
}

/**
 * 删除角色 (涉及权限大规模撤销，增加请求头)
 */
export const deleteRoleApi = (id: number) => {
  return request.delete<any, string>(`/system/role/delete/${id}`, {
    headers: PERM_UPDATE_HEADER
  })
}

/**
 * 获取已分配用户 (查询，无需请求头)
 */
export const getRoleUsersApi = (id: number) => {
  return request.get<any, number[]>(`/system/role/assigned-users/${id}`)
}

/**
 * 获取已分配权限 (查询，无需请求头)
 */
export const getRolePermsApi = (id: number) => {
  return request.get<any, number[]>(`/system/role/assigned-permissions/${id}`)
}

/**
 * 获取已分配数据规则 (查询，无需请求头)
 */
export const getRoleRulesApi = (id: number) => {
  return request.get<any, number[]>(`/system/role/assigned-data-rules/${id}`)
}

/**
 * 🌟 核心分配接口 A：分配用户
 * 改变了用户与角色的绑定关系，必须增加请求头
 */
export const assignUsersApi = (data: any) => {
  return request.post<any, string>('/system/role/assign-users', data, {
    headers: PERM_UPDATE_HEADER
  })
}

/**
 * 🌟 核心分配接口 B：分配功能与字段
 * 直接影响 RBAC 模型的输出，必须增加请求头
 */
export const assignPermsApi = (data: any) => {
  return request.post<any, string>('/system/role/assign-permissions', data, {
    headers: PERM_UPDATE_HEADER
  })
}

/**
 * 🌟 核心分配接口 C：分配数据范围规则
 * 直接影响 ABAC 模型的 SQL 注入逻辑，必须增加请求头
 */
export const assignRulesApi = (data: any) => {
  return request.post<any, string>('/system/role/assign-data-rules', data, {
    headers: PERM_UPDATE_HEADER
  })
}
