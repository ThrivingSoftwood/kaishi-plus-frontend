<template>
  <div class="app-container">
    <!-- 1. 主控制区与本地部门树 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>组织架构 (本地映射视图)</span>
          <el-button type="primary" icon="Refresh" @click="openSyncDialog">
            同步管家婆部门
          </el-button>
        </div>
      </template>

      <!-- 🌟 本地部门树形表格 -->
      <el-table
        v-loading="loading"
        :data="deptTree"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="deptName" label="部门名称" min-width="200"/>

        <el-table-column prop="oriDepartmentTypeid" label="管家婆来源ID" width="180" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.oriDepartmentTypeid }}</el-tag>
          </template>
        </el-table-column>

        <!-- 快速编辑：排序号 -->
        <el-table-column prop="sortOrder" label="排序" width="150" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sortOrder"
              :min="0"
              :max="999"
              controls-position="right"
              size="small"
              style="width: 100px;"
              @change="handleUpdate(row)"
            />
          </template>
        </el-table-column>

        <!-- 快速编辑：状态开关 -->
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleUpdate(row)"
            />
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="danger" link icon="Delete" @click="handleDelete(row)">
              移除映射
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 2. 🌟 管家婆待同步部门弹窗 -->
    <el-dialog
      title="从管家婆引入新部门"
      v-model="syncDialogVisible"
      width="600px"
      destroy-on-close
    >
      <div v-loading="syncLoading" class="sync-tree-wrapper">
        <div v-if="unsyncedTree.length === 0 && !syncLoading" class="empty-hint">
          <el-empty description="当前管家婆中没有需要同步的新部门"/>
        </div>

        <!-- 使用 el-tree 带有复选框的树，非常适合多选层级数据 -->
        <el-tree
          v-else
          ref="erpTreeRef"
          :data="unsyncedTree"
          :props="{label: 'fullName', children: 'children', disabled: 'synced'}"
          node-key="typeid"
          show-checkbox
          default-expand-all
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="unsyncedTree.length === 0"
            :loading="submitSyncLoading"
            @click="submitSync"
          >
            确认引入勾选部门
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import type {ElTree} from 'element-plus'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  deleteDeptApi,
  type DepartmentVO,
  getSyncedDeptTreeApi,
  getUnsyncedDeptTreeApi,
  syncDepartmentsApi,
  type SysDeptVO,
  updateDeptApi
} from '@/api/system/dept'

// 1. 本地视图状态
const loading = ref(false)
const deptTree = ref<SysDeptVO[]>([])

// 2. 同步弹窗状态
const syncDialogVisible = ref(false)
const syncLoading = ref(false)
const submitSyncLoading = ref(false)
const unsyncedTree = ref<DepartmentVO[]>([])
const erpTreeRef = ref<InstanceType<typeof ElTree>>()

// 初始化加载本地树
const fetchLocalTree = async () => {
  loading.value = true
  try {
    const res = await getSyncedDeptTreeApi()
    deptTree.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLocalTree()
})

// === 快捷更新逻辑 (状态/排序) ===
const handleUpdate = async (row: SysDeptVO) => {
  try {
    await updateDeptApi({id: row.id, sortOrder: row.sortOrder, status: row.status})
    ElMessage.success('更新成功')
  } catch (error) {
    console.error(error)
  }

  fetchLocalTree()
}

// === 删除逻辑 ===
const handleDelete = (row: SysDeptVO) => {
  if (row.children && row.children.length > 0) {
    return ElMessage.warning('该部门存在下级，禁止直接删除！')
  }
  ElMessageBox.confirm(`确定要移除部门【${row.deptName}】的系统映射吗？`, '高危操作', {type: 'error'})
    .then(async () => {
      const resMsg = await deleteDeptApi({id: row.id})
      ElMessage.success(resMsg || '删除成功')
      fetchLocalTree()
    })
}

// === 同步管家婆数据逻辑 ===
const openSyncDialog = async () => {
  syncDialogVisible.value = true
  syncLoading.value = true
  try {
    const res = await getUnsyncedDeptTreeApi()
    unsyncedTree.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    syncLoading.value = false
  }
}

const submitSync = async () => {
  if (!erpTreeRef.value) return

  // 🌟 核心：获取树形组件中被勾选的节点 ID 数组
  // getCheckedKeys(false) 表示不包含半选中的父节点，因为你的后端会向上递归兜底！
  const checkedKeys = erpTreeRef.value.getCheckedKeys(false) as string[]

  // 2. 🌟 关键：获取半选中的父节点 ID
  const halfCheckedKeys = erpTreeRef.value.getHalfCheckedKeys() as string[]

  // 3. 合并两者，确保从根节点到叶子节点的完整路径都被传回后端
  const allSelectedKeys = [...checkedKeys, ...halfCheckedKeys]

  if (allSelectedKeys.length === 0) {
    return ElMessage.warning('请至少勾选一个需要引入的部门')
  }

  submitSyncLoading.value = true
  try {
    await syncDepartmentsApi({typeIds: allSelectedKeys})
    ElMessage.success('管家婆部门同步成功！')
    syncDialogVisible.value = false

    // 重新拉取本地树，更新视图
    fetchLocalTree()
  } catch (error) {
    console.error(error)
  } finally {
    submitSyncLoading.value = false
  }
}
</script>

<style scoped>
.app-container {
  height: 100%;
}

.table-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.sync-tree-wrapper {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 10px;
}

.empty-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
