<template>
  <div :class="{ 'is-disabled': disabled }" class="upload-container">
    <el-upload
      ref="uploadRef"
      v-model:file-list="internalFileList"
      :accept="accept"
      :before-upload="handleBeforeUpload"
      :class="{ 'hide-upload-btn': internalFileList.length >= limit || disabled }"
      :disabled="disabled"
      :drag="drag && !disabled"
      :http-request="customUpload"
      :limit="limit"
      :list-type="listType"
      :multiple="limit > 1"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      action="#"
    >
      <!-- 非禁用状态下的上传入口 -->
      <template v-if="!disabled">
        <template v-if="drag">
          <el-icon class="el-icon--upload">
            <UploadFilled/>
          </el-icon>
          <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
        </template>
        <template v-else-if="listType === 'picture-card'">
          <el-icon>
            <Plus/>
          </el-icon>
        </template>
        <template v-else>
          <el-button type="primary">点击上传</el-button>
        </template>
      </template>

      <!-- 提示文字 -->
      <template v-if="showTip && !disabled" #tip>
        <div class="el-upload__tip">
          支持 {{ accept }} 格式，单文件不超过 {{ maxSize }}MB，最多 {{ limit }} 个。
        </div>
      </template>
    </el-upload>

    <!-- 大图预览 -->
    <el-dialog v-model="dialogVisible" append-to-body destroy-on-close title="图片预览" width="50%">
      <img :src="previewImageUrl" alt="Preview Image" class="preview-img" w-full/>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue'
import {Plus, UploadFilled} from '@element-plus/icons-vue'
import type {UploadFile, UploadFiles, UploadRequestOptions} from 'element-plus'
import {ElMessage} from 'element-plus'
import {uploadFileApi} from "@/arch/file/api.ts";

defineOptions({name: 'FileUpload'})
const props = defineProps({
  modelValue: {type: [Array, String], default: () => []},
  limit: {type: Number, default: 5},
  maxSize: {type: Number, default: 10},
  accept: {type: String, default: 'image/jpeg,image/png,image/gif'},
  listType: {type: String, default: 'picture-card'},
  drag: {type: Boolean, default: false},
  showTip: {type: Boolean, default: true},
  disabled: {type: Boolean, default: false}
})

const emit = defineEmits(['update:modelValue'])

const internalFileList = ref<UploadFile[]>([])
const dialogVisible = ref(false)
const previewImageUrl = ref('')

// 🌟 核心 1：监听外部 modelValue 变化，精准回显 fileList
watch(
  () => props.modelValue,
  (newVal) => {
    let urls: string[] = []
    if (Array.isArray(newVal)) {
      urls = newVal.filter(url => typeof url === 'string' && url.trim() !== '')
    } else if (typeof newVal === 'string' && newVal.trim() !== '') {
      urls = [newVal]
    }

    // 对比现有列表，避免重复渲染导致闪烁
    const currentUrls = internalFileList.value.map(f => f.url).filter(Boolean)
    if (urls.join(',') !== currentUrls.join(',')) {
      internalFileList.value = urls.map((url, index) => ({
        name: url.split('/').pop() || `file_${index}`,
        url: url,
        uid: Date.now() + index, // 保证 key 唯一
        status: 'success'
      })) as UploadFile[]
    }
  },
  {immediate: true, deep: true}
)

// 🌟 核心 2：将内部 fileList 的变化反馈给外部 modelValue
const syncToParent = (files: UploadFiles) => {
  const validUrls = files.filter(f => f.status === 'success' && f.url).map(f => f.url as string)
  if (props.limit === 1) {
    emit('update:modelValue', validUrls.length > 0 ? validUrls[0] : '')
  } else {
    emit('update:modelValue', validUrls)
  }
}

// 校验
const handleBeforeUpload = (file: File) => {
  // 1. 校验大小
  const isWithinSize = file.size / 1024 / 1024 <= props.maxSize
  if (!isWithinSize) {
    ElMessage.error(`上传文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }

  // 2. 🌟 增强版校验类型 (防 file.type 为空的坑)
  if (props.accept && props.accept !== '*') {
    // 获取文件的 MIME type (全部转小写防御大小写不一致)
    const fileType = file.type ? file.type.toLowerCase() : ''
    // 获取文件的扩展名 (如 '.jpg')
    const fileName = file.name.toLowerCase()
    const fileExt = fileName.substring(fileName.lastIndexOf('.'))

    const acceptTypes = props.accept.split(',').map(t => t.trim().toLowerCase())

    const isValidType = acceptTypes.some(type => {
      // 匹配泛类型 (如 'image/*')
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.replace('/*', ''))
      }
      // 匹配明确的扩展名 (如 '.jpg', '.png')
      if (type.startsWith('.')) {
        return fileExt === type
      }
      // 匹配明确的 MIME type (如 'image/jpeg')
      return fileType === type
    })

    if (!isValidType) {
      ElMessage.error(`仅支持上传 ${props.accept} 格式的文件!`)
      return false
    }
  }

  return true
}

// 自定义上传逻辑
const customUpload = async (options: UploadRequestOptions) => {
  const targetFile = internalFileList.value.find(f => f.uid === options.file.uid)
  if (targetFile) targetFile.status = 'uploading'

  try {
    const fileUrl = await uploadFileApi(options.file)
    if (targetFile) {
      targetFile.status = 'success'
      targetFile.url = fileUrl
    }
    syncToParent(internalFileList.value)
    options.onSuccess(fileUrl)
  } catch (error) {
    if (targetFile) targetFile.status = 'fail'
    options.onError(error as any)
  }
}

const handleRemove = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  syncToParent(uploadFiles)
}

const handlePreview = (uploadFile: UploadFile) => {
  if (!uploadFile.url) return
  previewImageUrl.value = uploadFile.url
  dialogVisible.value = true
}
</script>

<style scoped>
.upload-container {
  width: 100%;
}

/* 🌟 核心：当数量达到限制或处于 disabled 模式时，彻底隐藏上传触发框 */
.hide-upload-btn :deep(.el-upload--picture-card),
.hide-upload-btn :deep(.el-upload-dragger) {
  display: none !important;
}

/* 🌟 核心：在只读模式下，强制隐藏删除按钮 (垃圾桶图标)，只保留放大镜预览图标 */
.is-disabled :deep(.el-upload-list__item-delete) {
  display: none !important;
}

.preview-img {
  width: 100%;
  display: block;
}

.el-upload__tip {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-top: 8px;
  line-height: 1.4;
}
</style>
