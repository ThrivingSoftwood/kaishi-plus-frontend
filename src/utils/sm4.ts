import { sm4 } from 'sm-crypto'

// 与后端 application-security.yml 中 security.web.key / iv 保持一致
const WEB_SM4_KEY = import.meta.env.VITE_APP_SM4_KEY || '这里填入你后端的web.key'
const WEB_SM4_IV = import.meta.env.VITE_APP_SM4_IV || '这里填入你后端的web.iv'

export function encryptPassword(plainText: string): string {
  if (!plainText) return ''
  return sm4.encrypt(plainText, WEB_SM4_KEY, {
    mode: 'cbc',
    iv: WEB_SM4_IV
  })
}
