import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 基础身份信息
  const token = ref<string>(localStorage.getItem('kaishi_token') || '')
  const loginAccount = ref<string>(localStorage.getItem('kaishi_account') || '')
  const username = ref<string>(localStorage.getItem('kaishi_user') || '')

  // 🌟 核心补丁：权限标识集合 (从 LocalStorage 恢复)
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('kaishi_perms') || '[]'))

  const isAuthenticated = computed<boolean>(() => !!token.value)

  /**
   * 🌟 核心补丁：上帝模式与权限判定
   */
  function hasPerm(perm: string): boolean {
    // 1. 如果账号是 kaishi，直接放行 (上帝模式)
    if (loginAccount.value === 'kaishi') return true
    // 2. 如果权限列表包含 '*' (超管角色)，直接放行
    if (permissions.value.includes('*')) return true
    // 3. 匹配具体的权限标识
    return permissions.value.includes(perm)
  }

  /**
   * 登录时全量设置信息
   */
  function setAuthInfo(newToken: string, newLoginAccount: string, newUsername: string, newPerms: string[]) {
    token.value = newToken
    loginAccount.value = newLoginAccount
    username.value = newUsername
    permissions.value = newPerms || []

    localStorage.setItem('kaishi_token', newToken)
    localStorage.setItem('kaishi_account', newLoginAccount)
    localStorage.setItem('kaishi_user', newUsername)
    localStorage.setItem('kaishi_perms', JSON.stringify(permissions.value))
  }

  /**
   * 🌟 核心补丁：静默刷新时仅更新 Token 和权限
   */
  function updateTokenAndPerms(newToken: string, newPerms: string[]) {
    token.value = newToken
    permissions.value = newPerms || []
    localStorage.setItem('kaishi_token', newToken)
    localStorage.setItem('kaishi_perms', JSON.stringify(permissions.value))
  }

  function clearAuth() {
    token.value = ''
    loginAccount.value = ''
    username.value = ''
    permissions.value = []
    localStorage.removeItem('kaishi_token')
    localStorage.removeItem('kaishi_account')
    localStorage.removeItem('kaishi_user')
    localStorage.removeItem('kaishi_perms')
  }

  return {
    token, loginAccount, username, permissions,
    isAuthenticated, hasPerm, setAuthInfo, updateTokenAndPerms, clearAuth
  }
})
