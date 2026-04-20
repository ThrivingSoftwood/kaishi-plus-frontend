import request from '@/utils/request'

export const getPermissionTreeApi = () => {
  return request.get<any, any[]>('/system/permission/tree')
}

export const savePermissionApi = (data: any) => {
  return request.post('/system/permission/save', data)
}

export const updatePermissionApi = (data: any) => {
  return request.put('/system/permission/update', data)
}

export const deletePermissionApi = (id: number) => {
  return request.delete(`/system/permission/delete/${id}`)
}

export const getMenusApi = (loginAccount: string) => {
  return request.get<any, any[]>(`/system/permission/getMenuPermissions/${loginAccount}`)
}
