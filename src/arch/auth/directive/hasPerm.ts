// File: ./src/directives/hasPerm.ts
import type { Directive, DirectiveBinding } from 'vue'
import {useAuthStore} from "@/arch/auth/store/store.ts";


/**
 * 🚀 核心指令：v-hasPerm
 * 作用：判断当前用户是否拥有某个按钮或操作的权限标识，若无，则直接从 DOM 树中物理移除该节点。
 */
export const hasPerm: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding
    const authStore = useAuthStore()

    // 🌟 上帝模式免疫：超级管理员账号无视一切前端 UI 拦截
    if (authStore.godMode) return

    if (value && typeof value === 'string') {
      const permissions = authStore.permissions ||[]
      // 判断是否拥有该权限
      const hasPermission = permissions.includes(value)

      if (!hasPermission) {
        // 🗡️ 物理抹除：没有权限，直接把自己从 DOM 树里连根拔起
        el.parentNode && el.parentNode.removeChild(el)
      }
    } else {
      throw new Error(`请指定权限标识值！例如: v-hasPerm="'purchase:trace:finish'"`)
    }
  }
}
