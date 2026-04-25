export interface LoginResp {
  token: string
  username: string
  permissions?: string[]
  roleCodes?: string[]
}
