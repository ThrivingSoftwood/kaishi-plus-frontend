import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('kaishi_token') || '')
  const loginAccount = ref<string>(localStorage.getItem('kaishi_account') || '')
  const username = ref<string>(localStorage.getItem('kaishi_user') || '')
  // 🌟 新增：持久化用户的具体权限标识 (如 purchase:price:view)
  const permissions = ref<string[]>(JSON.parse(localStorage.getItem('kaishi_perms') || '[]'))
  const roleCodes = ref<string[]>(JSON.parse(localStorage.getItem('kaishi_roles') || '[]'))

  const isAuthenticated = computed<boolean>(() => !!token.value)

  // 🌟 核心判定：是否为超级管理员 (上帝模式)
  const godMode = computed(() => roleCodes.value.includes('SUPER_ADMIN'))

  // 🌟 核心：判定是否拥有某个权限 (供 v-hasPerm 指令或代码层调用)
  const hasPermission = (permCode: string) => {
    // 超管账号拥有所有权限 (与后端保持一致)
    if (godMode.value) return true
    return permissions.value.includes(permCode);
  }

  function setAuthInfo(newToken: string, newLoginAccount: string, newUsername: string, newPerms: string[] =[], newRoles: string[] = []) {
    token.value = newToken
    loginAccount.value = newLoginAccount
    username.value = newUsername
    permissions.value = newPerms
    roleCodes.value = newRoles
    localStorage.setItem('kaishi_token', newToken)
    localStorage.setItem('kaishi_account', newLoginAccount)
    localStorage.setItem('kaishi_user', newUsername)
    localStorage.setItem('kaishi_perms', JSON.stringify(newPerms))
    localStorage.setItem('kaishi_roles', JSON.stringify(newRoles))
  }

  function clearAuth() {
    token.value = ''
    loginAccount.value = ''
    username.value = ''
    permissions.value = []
    roleCodes.value = []

    // 精准删除
    localStorage.removeItem('kaishi_token')
    localStorage.removeItem('kaishi_account')
    localStorage.removeItem('kaishi_user')
    localStorage.removeItem('kaishi_perms')
    localStorage.removeItem('kaishi_roles')
  }

  return { token, loginAccount, username, permissions, roleCodes, godMode, isAuthenticated, hasPermission, setAuthInfo, clearAuth}
})
