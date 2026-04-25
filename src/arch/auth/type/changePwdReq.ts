// 修改密码的请求载荷 (DTO)
export interface ChangePwdReq {
  loginAccount: string
  oldPasswordEnc: string // 加密后的旧密码
  newPasswordEnc: string // 加密后的新密码
}
