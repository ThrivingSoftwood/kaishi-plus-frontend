import index from "@/arch/request";


export const getPermissionTreeApi = () => {
  return index.get<any, any[]>('/system/permission/tree')
}

export const savePermissionApi = (data: any) => {
  return index.post('/system/permission/save', data)
}

export const updatePermissionApi = (data: any) => {
  return index.put('/system/permission/update', data)
}

export const deletePermissionApi = (id: number) => {
  return index.delete(`/system/permission/delete/${id}`)
}

export const getMenusApi = (loginAccount: string) => {
  return index.get<any, any[]>(`/system/permission/getMenuPermissions/${loginAccount}`)
}
