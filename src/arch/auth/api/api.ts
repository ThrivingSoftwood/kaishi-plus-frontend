import request from "@/arch/request";
import type {LoginReq} from "@/arch/auth/type/loginReq.ts";
import type {LoginResp} from "@/arch/auth/type/loginResp.ts";
import type {ChangePwdReq} from "@/arch/auth/type/changePwdReq.ts";


export const loginApi = (data: LoginReq) => {
  return request.post<any, LoginResp>('/auth/login', data)
}

// 修改密码 API
export const changePasswordApi = (data: ChangePwdReq) => {
  return request.post<any, any>('/auth/changePassword', data)
}
