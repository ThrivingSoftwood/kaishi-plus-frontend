<template>
  <!-- 注意这里的 :index 变成了 menu.fullPath -->
  <el-sub-menu v-if="menu.permissionType === 1" :index="menu.fullPath">
    <template #title>
      <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
      <span>{{ menu.permissionName }}</span>
    </template>
    <SidebarItem
      v-for="child in menu.children"
      :key="child.id"
      :menu="child"
    />
  </el-sub-menu>

  <!-- 注意这里的 :index 变成了 menu.fullPath -->
  <el-menu-item v-else-if="menu.permissionType === 2" :index="menu.fullPath">
    <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
    <template #title>
      <span>{{ menu.permissionName }}</span>
    </template>
  </el-menu-item>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SidebarItem' })

defineProps<{
  menu: {
    id: number
    path: string
    fullPath: string // 🌟 接收新属性
    permissionName: string
    permissionType: number
    icon?: string
    children?: any[]
  }
}>()
</script>
