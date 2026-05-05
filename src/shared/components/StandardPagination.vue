<template>
  <div class="page-pagination">
    <!-- 左侧：自定义每页条数 -->
    <div class="custom-page-size">
      <span class="label">每页显示：</span>
      <el-input-number
        v-model="internalPageSize"
        :max="1000"
        :min="1"
        :step="10"
        controls-position="right"
        size="small"
        @change="handleChange"
      />
      <span class="unit">条</span>
    </div>

    <!-- 右侧：Element 原生分页器 -->
    <el-pagination
      v-model:current-page="internalPageNo"
      v-model:page-size="internalPageSize"
      :total="total"
      background
      layout="total, prev, pager, next, jumper"
      @current-change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'

defineOptions({name: 'StandardPagination'})

const props = defineProps<{
  total: number
  pageNo: number
  pageSize: number
}>()

const emit = defineEmits(['update:pageNo', 'update:pageSize', 'refresh'])

const internalPageNo = computed({
  get: () => props.pageNo,
  set: (val) => emit('update:pageNo', val)
})

const internalPageSize = computed({
  get: () => props.pageSize,
  set: (val) => emit('update:pageSize', val)
})

const handleChange = () => {
  emit('refresh')
}
</script>

<style scoped>
/* 🌟 严格锁定分页区为单行，并靠右下角对齐 */
.page-pagination {
  flex-shrink: 0; /* 绝不允许分页区被压缩 */
  margin-top: 15px; /* 与上方表格保持距离 */
  display: flex;
  justify-content: flex-end; /* 靠右侧对齐 */
  align-items: center; /* 垂直居中对齐 */
  flex-wrap: nowrap; /* 强制绝对单行，禁止换行 */
  width: 100%;
}

.custom-page-size {
  display: flex;
  align-items: center;
  margin-right: 16px; /* 控制和右侧分页器的间距 */
  white-space: nowrap; /* 强制文本不换行 */
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.custom-page-size .label {
  margin-right: 8px;
}

.custom-page-size .unit {
  margin-left: 8px;
}

:deep(.custom-page-size .el-input-number) {
  width: 100px; /* 统一数字输入框长度 */
}
</style>
