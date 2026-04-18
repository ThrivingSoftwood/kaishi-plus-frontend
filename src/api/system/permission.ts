import request from '@/utils/request'

export const getPermissionTreeApi = () => {
  return request.get<any, any[]>('/kaishi/system/permission/tree')
}

export const savePermissionApi = (data: any) => {
  return request.post('/kaishi/system/permission/save', data)
}

export const updatePermissionApi = (data: any) => {
  return request.put('/kaishi/system/permission/update', data)
}

export const deletePermissionApi = (id: number) => {
  return request.delete(`/kaishi/system/permission/delete/${id}`)
}

export const getMenusApi = (loginAccount: string) => {
  return request.get<any, any[]>(`/kaishi/system/permission/getMenuPermissions/${loginAccount}`)
}
