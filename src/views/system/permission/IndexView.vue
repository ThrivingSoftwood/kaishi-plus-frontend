<template>
  <div class="permission-container">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>菜单与资源权限管理</span>
          <el-button type="primary" icon="Plus" @click="openDialog(null)">新增根节点</el-button>
        </div>
      </template>

      <!-- 🌟 树形表格：只要数据里有 children 字段且指定 row-key，自动渲染为树 -->
      <el-table
        v-loading="loading"
        :data="treeData"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="permissionName" label="节点名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon" size="18"><component :is="row.icon" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="permissionType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.permissionType === 1" type="info">目录</el-tag>
            <el-tag v-else-if="row.permissionType === 2" type="success">菜单</el-tag>
            <el-tag v-else-if="row.permissionType === 3" type="warning">按钮</el-tag>
            <el-tag v-else-if="row.permissionType === 5" type="danger">数据列</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permissionCode" label="权限标识" min-width="180" />
        <el-table-column prop="path" label="路由路径" min-width="150" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" min-width="180" show-overflow-tooltip />

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <!-- 按钮和列字段不允许再添加子节点 -->
            <el-button v-if="row.permissionType === 1 || row.permissionType === 2"
                       type="primary" link icon="Plus" @click="openDialog(row)">
              新增
            </el-button>
            <el-button type="primary" link icon="Edit" @click="openDialog(row, true)">
              修改
            </el-button>
            <el-button type="danger" link icon="Delete" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="550px" destroy-on-close>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">

        <el-form-item label="上级节点">
          <!-- 这里实际开发可以用 el-tree-select 选父节点，这里简单展示父节点名称 -->
          <el-input v-model="parentName" disabled />
        </el-form-item>

        <el-form-item label="节点类型" prop="permissionType">
          <el-radio-group v-model="formData.permissionType" @change="handleTypeChange">
            <el-radio :label="1">目录</el-radio>
            <el-radio :label="2">菜单</el-radio>
            <el-radio :label="3">按钮</el-radio>
            <el-radio :label="5">敏感数据列</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="节点名称" prop="permissionName">
          <el-input v-model="formData.permissionName" placeholder="请输入名称" />
        </el-form-item>

        <!-- 🌟 动态表单联动：目录/菜单 显示图标 -->
        <el-form-item v-if="[1, 2].includes(formData.permissionType)" label="菜单图标">
          <el-input v-model="formData.icon" placeholder="请输入 Element Plus 图标名，如: Setting" />
        </el-form-item>

        <!-- 🌟 动态表单联动：目录/菜单 显示路由路径 -->
        <el-form-item v-if="[1, 2].includes(formData.permissionType)" label="路由地址" prop="path">
          <el-input v-model="formData.path" placeholder="请输入路由路径，如: /purchase/trace" />
        </el-form-item>

        <!-- 🌟 动态表单联动：仅菜单 显示组件路径 -->
        <el-form-item v-if="formData.permissionType === 2" label="组件路径" prop="component">
          <el-input v-model="formData.component" placeholder="请输入组件路径，如: purchase/trace/IndexView" />
        </el-form-item>

        <!-- 🌟 动态表单联动：菜单/按钮/字段 显示权限标识 -->
        <el-form-item v-if="[2, 3, 5].includes(formData.permissionType)" label="权限标识" prop="permissionCode">
          <el-input v-model="formData.permissionCode" placeholder="如: purchase:price:view" />
          <div class="form-tip">后端校验或前端控制 UI 显示的唯一依据</div>
        </el-form-item>

        <el-form-item label="显示排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getPermissionTreeApi, savePermissionApi, updatePermissionApi, deletePermissionApi } from '@/api/system/permission'

const loading = ref(false)
const treeData = ref<any[]>([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const parentName = ref('无 / 顶级节点')

// 表单数据
const formData = reactive({
  id: null as number | null,
  parentId: 0,
  permissionName: '',
  permissionCode: '',
  permissionType: 1,
  path: '',
  component: '',
  icon: '',
  sortOrder: 0
})

// 🌟 动态校验规则
const formRules = reactive<FormRules>({
  permissionName: [{ required: true, message: '节点名称不能为空', trigger: 'blur' }],
  // 菜单必须要有路由和组件路径
  path: [{ required: true, message: '路由地址不能为空', trigger: 'blur' }],
  component: [{ required: true, message: '组件路径不能为空', trigger: 'blur' }],
  // 按钮和字段必须要有权限标识
  permissionCode: [{ required: true, message: '权限标识不能为空', trigger: 'blur' }]
})

// 初始化获取树
const fetchTree = async () => {
  loading.value = true
  try {
    const res = await getPermissionTreeApi()
    treeData.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTree()
})

// 切换类型时重置不相关的字段
const handleTypeChange = () => {
  if (formData.permissionType === 1) {
    formData.component = ''
    formData.permissionCode = ''
  } else if (formData.permissionType === 3 || formData.permissionType === 5) {
    formData.path = ''
    formData.component = ''
    formData.icon = ''
  }
}

// 打开弹窗 (row: 触发操作的行, isEdit: 是否是修改)
const openDialog = (row: any, isEdit = false) => {
  if (formRef.value) formRef.value.resetFields()

  if (isEdit) {
    dialogTitle.value = '修改节点'
    Object.assign(formData, row)
    parentName.value = row.parentId === 0 ? '顶级节点' : '请参考列表层级'
  } else {
    dialogTitle.value = '新增节点'
    // 重置表单
    Object.assign(formData, {
      id: null,
      parentId: row ? row.id : 0, // 如果是从某行点击新增，那那行就是父节点
      permissionName: '', permissionCode: '', permissionType: 1, path: '', component: '', icon: '', sortOrder: 0
    })
    parentName.value = row ? row.permissionName : '顶级节点'
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (formData.id) {
          await updatePermissionApi(formData)
          ElMessage.success('修改成功')
        } else {
          await savePermissionApi(formData)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        await fetchTree() // 刷新树
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (row: any) => {
  if (row.children && row.children.length > 0) {
    return ElMessage.warning('请先删除该节点下的所有子节点！')
  }
  ElMessageBox.confirm(`确定要删除【${row.permissionName}】吗？`, '警告', { type: 'warning' })
    .then(async () => {
      await deletePermissionApi(row.id)
      ElMessage.success('删除成功')
      await fetchTree()
    })
}
</script>

<style scoped>
.permission-container {
  padding: 0;
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.2;
}
</style>
