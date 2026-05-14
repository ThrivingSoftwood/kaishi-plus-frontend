<template>
  <!-- 使用 Element Plus 官方范围选择器类名 -->
  <div
    class="el-date-editor el-range-editor el-input__wrapper weight-range-picker"
    :class="[
      isFocused ? 'is-active' : '',
      isHover ? 'is-hover' : ''
    ]"
    @mouseenter="isHover = true"
    @mouseleave="isHover = false"
  >
    <!-- 前缀图标 -->
    <el-icon class="el-input__icon el-range__icon"><ScaleToOriginal /></el-icon>

    <!-- 最小重量 -->
    <input
      autocomplete="off"
      :placeholder="startPlaceholder"
      v-model.number="localMin"
      class="el-range-input"
      type="number"
      @focus="isFocused = true"
      @blur="handleBlur"
    />

    <!-- 分隔符 -->
    <span class="el-range-separator">{{ separator }}</span>

    <!-- 最大重量 -->
    <input
      autocomplete="off"
      :placeholder="endPlaceholder"
      v-model.number="localMax"
      class="el-range-input"
      type="number"
      @focus="isFocused = true"
      @blur="handleBlur"
    />

    <!-- 单位与清空按钮 -->
    <span class="range-suffix">
      <span v-if="!(clearable && isHover && hasValue)" class="unit-text">{{ unit }}</span>
      <el-icon
        v-else
        class="el-input__icon el-range__close-icon"
        @click.stop="clear"
      >
        <CircleClose />
      </el-icon>
    </span>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ScaleToOriginal, CircleClose } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [null, null] },
  startPlaceholder: { type: String, default: '最小' },
  endPlaceholder: { type: String, default: '最大' },
  separator: { type: String, default: '-' },
  unit: { type: String, default: 'g' },
  clearable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'change'])

const localMin = ref(props.modelValue[0])
const localMax = ref(props.modelValue[1])
const isFocused = ref(false)
const isHover = ref(false)

const hasValue = computed(() => localMin.value !== null || localMax.value !== null)

watch(() => props.modelValue, (newVal) => {
  if (Array.isArray(newVal)) {
    localMin.value = newVal[0] ?? null
    localMax.value = newVal[1] ?? null
  }
}, { deep: true })

const handleBlur = () => {
  isFocused.value = false
  // 延迟发射，确保能够处理两个输入框之间的焦点转换
  setTimeout(() => {
    if (!isFocused.value) {
      if (localMin.value !== null && localMax.value !== null && localMin.value > localMax.value) {
        [localMin.value, localMax.value] = [localMax.value, localMin.value]
      }
      emit('update:modelValue', [localMin.value, localMax.value])
      emit('change', [localMin.value, localMax.value])
    }
  }, 100)
}

const clear = () => {
  localMin.value = null
  localMax.value = null
  emit('update:modelValue', [null, null])
  emit('change', [null, null])
}
</script>

<style scoped>
/* 核心：深度适配 Element Plus 样式 */
.weight-range-picker {
  /* 确保宽度与 el-input 配合良好 */
  width: 220px;
  padding: 0 8px;
  cursor: text;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 移除 type=number 默认的上下箭头 */
}

/* 内部输入框样式重置 */
.el-range-input {
  appearance: none;
  -moz-appearance: textfield;
  border: none;
  background: transparent;
  width: 40%; /* 自动平分 */
  color: var(--el-input-text-color);
  text-align: center;
  outline: none;
}

.el-range-input::-webkit-inner-spin-button,
.el-range-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 模拟 el-range-editor 的样式 */
.el-range-separator {
  flex: 1;
  padding: 0;
  color: var(--el-text-color-primary);
}

.range-suffix {
  display: flex;
  align-items: center;
  min-width: 24px;
  justify-content: flex-end;
}

.unit-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
}

/* 覆盖 Element 的一些样式，确保紧凑 */
.el-range__icon {
  margin-right: 4px;
  color: var(--el-text-color-placeholder);
}

.el-range__close-icon {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
}

.el-range__close-icon:hover {
  color: var(--el-text-color-secondary);
}
</style>
