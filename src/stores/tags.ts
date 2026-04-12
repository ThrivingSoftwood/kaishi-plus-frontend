import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalized } from 'vue-router'

// 1. 定义一个精简的接口，只保留 Tab 组件需要的字段
export interface TagView {
  path: string
  name: string
  fullPath: string
  title: string
}

export const useTagsStore = defineStore('tags', () => {
  // 2. 存储精简后的对象数组
  const visitedViews = ref<TagView[]>([])

  // 添加新的标签页
  const addView = (view: RouteLocationNormalized) => {
    // 过滤掉不需要加入 Tab 的页面
    if (!view.name || view.name === 'Login') return

    // 如果已经存在，则不重复添加
    if (visitedViews.value.some(v => v.path === view.path)) return

    // 3. 只提取必要的字段存入快照
    visitedViews.value.push({
      path: view.path,
      fullPath: view.fullPath,
      name: view.name as string,
      title: (view.meta?.title as string) || '未命名'
    })
  }

  // 关闭标签页
  const delView = (viewPath: string | number) => {
    const index = visitedViews.value.findIndex(v => v.path === viewPath)
    if (index > -1) {
      visitedViews.value.splice(index, 1)
    }
  }

  return { visitedViews, addView, delView }
})
