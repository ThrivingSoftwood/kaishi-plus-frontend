import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  path: string
  name: string
  fullPath: string
  title: string
}

export const useTagsStore = defineStore('tags', () => {
  const visitedViews = ref<TagView[]>([])
  // 🌟 专供 keep-alive 的 include 使用的白名单
  const cachedViewNames = ref<string[]>([])

  const addView = (view: RouteLocationNormalized) => {
    if (!view.name || view.name === 'Login') return

    // 1. 添加到视图历史
    if (!visitedViews.value.some(v => v.path === view.path)) {
      visitedViews.value.push({
        path: view.path,
        fullPath: view.fullPath,
        name: view.name as string,
        title: (view.meta?.title as string) || '未命名'
      })
    }

    // 2. 🌟 添加到缓存白名单 (严格使用路由的 name)
    if (!cachedViewNames.value.includes(view.name as string)) {
      cachedViewNames.value.push(view.name as string)
    }
  }

  const delView = (viewPath: string | number) => {
    const index = visitedViews.value.findIndex(v => v.path === viewPath)
    if (index > -1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const viewName = visitedViews.value[index].name
      visitedViews.value.splice(index, 1)

      // 🌟 物理切断：同步从缓存白名单中剔除该组件
      const cacheIndex = cachedViewNames.value.indexOf(viewName)
      if (cacheIndex > -1) {
        cachedViewNames.value.splice(cacheIndex, 1)
      }
    }
  }

  return { visitedViews, cachedViewNames, addView, delView }
})
