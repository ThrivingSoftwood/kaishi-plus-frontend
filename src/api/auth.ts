import request from '@/utils/request'

export interface LoginReq {
  loginAccount: string
  encryptedPassword?: string
}

export interface LoginResp {
  token: string
  username: string
  permissions?: string[]
  roleCodes?: string[]
}

export const loginApi = (data: LoginReq) => {
  return request.post<any, LoginResp>('/auth/login', data)
}

// src/api/auth.ts 追加内容

// 修改密码的请求载荷 (DTO)
export interface ChangePwdReq {
  loginAccount: string
  oldPasswordEnc: string // 加密后的旧密码
  newPasswordEnc: string // 加密后的新密码
}

// 修改密码 API
export const changePasswordApi = (data: ChangePwdReq) => {
  return request.post<any, any>('/auth/changePassword', data)
}
