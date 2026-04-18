import request from '@/utils/request'

// 🌟 这里给 get 请求加上了泛型 <any, any[]>，明确告诉 TS 返回的是数组
export const getRolesApi = () => {
  return request.get<any, any[]>('/kaishi/system/role/list')
}

export const saveRoleApi = (data: any) => {
  return request.post<any, string>('/kaishi/system/role/save', data)
}

export const deleteRoleApi = (id: number) => {
  return request.delete<any, string>(`/kaishi/system/role/delete/${id}`)
}

// 🌟 核心修复：明确声明这三个接口返回的是 number[] (Long 类型的 ID 数组)
export const getRoleUsersApi = (id: number) => {
  return request.get<any, number[]>(`/kaishi/system/role/assigned-users/${id}`)
}

export const getRolePermsApi = (id: number) => {
  return request.get<any, number[]>(`/kaishi/system/role/assigned-permissions/${id}`)
}

export const getRoleRulesApi = (id: number) => {
  return request.get<any, number[]>(`/kaishi/system/role/assigned-data-rules/${id}`)
}

// 分配接口返回的是字符串提示
export const assignUsersApi = (data: any) => {
  return request.post<any, string>('/kaishi/system/role/assign-users', data)
}

export const assignPermsApi = (data: any) => {
  return request.post<any, string>('/kaishi/system/role/assign-permissions', data)
}

export const assignRulesApi = (data: any) => {
  return request.post<any, string>('/kaishi/system/role/assign-data-rules', data)
}
