import { defineStore } from 'pinia'
import {computed, ref} from "vue";
// 注意：ref, computed 已经被 Vite auto-import 插件自动引入，无需显式 import

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('kaishi_token') || '')
  const loginAccount = ref<string>(localStorage.getItem('kaishi_account') || '')
  const username = ref<string>(localStorage.getItem('kaishi_user') || '')

  const isAuthenticated = computed<boolean>(() => !!token.value)

  function setAuthInfo(newToken: string, newLoginAccount:string, newUsername: string) {
    token.value = newToken
    loginAccount.value = newLoginAccount
    username.value = newUsername
    localStorage.setItem('kaishi_token', newToken)
    localStorage.setItem('kaishi_account', newLoginAccount)
    localStorage.setItem('kaishi_user', newUsername)
  }

  function clearAuth() {
    token.value = ''
    loginAccount.value = ''
    username.value = ''
    localStorage.removeItem('kaishi_token')
    localStorage.removeItem('kaishi_account')
    localStorage.removeItem('kaishi_user')
  }

  return { token, loginAccount, username, isAuthenticated, setAuthInfo, clearAuth }
})
