<template>
  <div class="app-container">
    <!-- 🌟 1. 角色列表主控区 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>角色与授权管理 (装配车间)</span>
          <!-- 🌟 增加搜索框 -->
          <div style="display: flex; gap: 10px;">
            <el-input v-model="searchQuery" placeholder="搜索角色名称" clearable prefix-icon="Search" style="width: 200px;" />
            <el-button type="primary" icon="Plus" @click="openRoleDialog(null)">新增角色</el-button>
          </div>
        </div>
      </template>

      <!-- 🌟 将 :data="roleList" 改为 :data="filteredRoleList" -->
      <el-table v-loading="loading" :data="filteredRoleList" border stripe height="calc(100vh - 200px)">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="150" />
        <el-table-column prop="roleCode" label="角色编码" min-width="150">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.roleCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="dark" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 🌟 核心引擎：三大分配入口 -->
        <el-table-column label="权限装配 (核心流转)" min-width="320" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- 绑定物理人 -->
              <el-button type="primary" plain size="small" icon="User" @click="openAssignUsers(row)">
                分配用户
              </el-button>
              <!-- 绑定功能与字段 -->
              <el-button type="success" plain size="small" icon="Menu" @click="openAssignPerms(row)">
                功能与字段
              </el-button>
              <!-- 🌟 绑定行级过滤规则 -->
              <el-button type="warning" plain size="small" icon="Filter" @click="openAssignRules(row)">
                数据范围
              </el-button>
            </div>
          </template>
        </el-table-column>

        <!-- 基础操作 -->
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link icon="Edit" @click="openRoleDialog(row)">编辑</el-button>
            <el-button type="danger" link icon="Delete" @click="handleDeleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 🌟 2. 角色基础信息弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px" destroy-on-close>
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model.trim="roleForm.roleName" placeholder="请输入角色名称，如: 华东区采购员" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model.trim="roleForm.roleCode" placeholder="请输入唯一编码(暂不支持中文)，如: BUYER_EAST" :disabled="!!roleForm.id" />
        </el-form-item>
        <el-form-item label="显示排序" prop="sortOrder">
          <el-input-number v-model="roleForm.sortOrder" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="角色状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio :label="1">正常启用</el-radio>
            <el-radio :label="0">暂时停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitRole">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- 🌟 3. 抽屉 A：分配用户 (基于部门混合树) -->
    <el-drawer v-model="drawerUserVisible" :title="`为【${currentRow?.roleName}】分配用户`" size="450px" destroy-on-close>
      <div v-loading="drawerLoading" class="drawer-content">
        <el-alert title="勾选部门可快捷全选该部门下的所有员工" type="info" show-icon style="margin-bottom: 15px;" />

        <!-- 🌟 新增搜索框 -->
        <el-input v-model="userSearchQuery" placeholder="输入名称或账号快捷筛选" clearable prefix-icon="Search" style="margin-bottom: 10px;" />

        <el-tree
          ref="userTreeRef"
          :data="userTreeData"
          :filter-node-method="filterNode"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          show-checkbox
          default-expand-all
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-icon v-if="data.nodeType === 1" color="#E6A23C"><FolderOpened /></el-icon>
              <el-icon v-else color="#409EFF"><User /></el-icon>
              <span :class="{ 'is-dept': data.nodeType === 1 }" style="margin-left: 6px;">{{ node.label }}</span>
              <span v-if="data.nodeType === 2" class="node-ext-code">({{ data.extCode }})</span>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="drawerUserVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAssignUsers">保存用户分配</el-button>
      </template>
    </el-drawer>

    <!-- 🌟 4. 抽屉 B：分配功能权限 (RBAC) -->
    <el-drawer v-model="drawerPermVisible" :title="`为【${currentRow?.roleName}】分配功能与字段`" size="450px" destroy-on-close>
      <div v-loading="drawerLoading" class="drawer-content">
        <el-alert title="配置立即生效，相关用户将在后台无感刷新权限" type="success" show-icon style="margin-bottom: 15px;" />
        <el-tree
          ref="permTreeRef"
          :data="permTreeData"
          :props="{ label: 'permissionName', children: 'children' }"
          node-key="id"
          show-checkbox
          default-expand-all
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-tag v-if="data.permissionType === 1" size="small" type="info" class="mr-2">目录</el-tag>
              <el-tag v-else-if="data.permissionType === 2" size="small" type="success" class="mr-2">菜单</el-tag>
              <el-tag v-else-if="data.permissionType === 3" size="small" type="warning" class="mr-2">按钮</el-tag>
              <el-tag v-else-if="data.permissionType === 5" size="small" type="danger" effect="dark" class="mr-2">字段</el-tag>
              <span :class="{ 'is-dept': data.permissionType === 1 || data.permissionType === 2 }">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="drawerPermVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAssignPerms">保存功能权限</el-button>
      </template>
    </el-drawer>

    <!-- 🌟 5. 抽屉 C：分配数据规则 (ABAC) -->
    <el-drawer v-model="drawerRuleVisible" :title="`为【${currentRow?.roleName}】配置数据范围`" size="600px" destroy-on-close>
      <div v-loading="drawerLoading" class="drawer-content">
        <el-alert title="勾选后，该角色查询业务表时将被强制加上底层 SQL 拦截" type="warning" show-icon style="margin-bottom: 15px;" />

        <!-- 🌟 核心：使用 el-table 多选模式展示所有已定义的规则 -->
        <el-table
          ref="ruleTableRef"
          :data="allRulesData"
          @selection-change="handleRuleSelection"
          border stripe
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="targetResource" label="受控资源" width="130">
            <template #default="{ row }">
              <el-tag size="small">{{ row.targetResource }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ruleName" label="规则名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="scopeType" label="规则类型" width="130" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.scopeType===1" type="success" size="small">全部数据</el-tag>
              <el-tag v-else-if="row.scopeType===2" type="info" size="small">仅看本人</el-tag>
              <el-tag v-else-if="row.scopeType===3" type="warning" size="small">本部门</el-tag>
              <el-tag v-else-if="row.scopeType===4" type="warning"  effect="dark" size="small">本部门及下属</el-tag>
              <el-tag v-else-if="row.scopeType===5" type="danger" size="small">自定义</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="drawerRuleVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAssignRules">保存规则配置</el-button>
      </template>
    </el-drawer>

  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, ElTree, ElTable } from 'element-plus'
import { FolderOpened, User } from '@element-plus/icons-vue'

import {
  getRolesApi, saveRoleApi, deleteRoleApi,
  getRoleUsersApi, getRolePermsApi, getRoleRulesApi,
  assignUsersApi, assignPermsApi, assignRulesApi
} from '@/api/system/role'
import { getSystemUserTreeApi } from '@/api/system/user'
import { getPermissionTreeApi } from '@/api/system/permission'
import { getAllDataRulesApi } from '@/api/system/dataRule' // 🌟 新增 API 引入

// ================== 1. 角色 CRUD ==================
const loading = ref(false)
const roleList = ref<any[]>([])
const currentRow = ref<any>(null)

// 🌟 新增：列表纯前端过滤计算属性
const searchQuery = ref('')
const filteredRoleList = computed(() => {
  if (!searchQuery.value) return roleList.value
  const query = searchQuery.value.toLowerCase()
  return roleList.value.filter(role =>
    role.roleName && role.roleName.toLowerCase().includes(query)
  )
})

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRolesApi()
    roleList.value = res || []
  } finally {
    loading.value = false
  }
}
onMounted(() => fetchRoles())

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const roleFormRef = ref<FormInstance>()
const roleForm = reactive({ id: null as number|null, roleName: '', roleCode: '', sortOrder: 0, status: 1 })
const roleRules = reactive<FormRules>({
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
  roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }]
})

const openRoleDialog = (row: any) => {
  if (roleFormRef.value) roleFormRef.value.resetFields()
  if (row) {
    dialogTitle.value = '编辑角色'
    Object.assign(roleForm, row)
  } else {
    dialogTitle.value = '新增角色'
    Object.assign(roleForm, { id: null, roleName: '', roleCode: '', sortOrder: 0, status: 1 })
  }
  dialogVisible.value = true
}

const submitRole = async () => {
  if (!roleFormRef.value) return
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await saveRoleApi(roleForm)
        ElMessage.success('保存成功')
        dialogVisible.value = false
        fetchRoles()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDeleteRole = (row: any) => {
  ElMessageBox.confirm(`确定要彻底删除角色【${row.roleName}】吗？绑定的用户将失去该角色所有权限！`, '高危操作', { type: 'error' })
    .then(async () => {
      await deleteRoleApi(row.id)
      ElMessage.success('角色已删除')
      fetchRoles()
    })
}

// ================== 2. 抽屉公用状态 ==================
const drawerLoading = ref(false)

// ================== 3. 抽屉 A：分配用户 ==================
const drawerUserVisible = ref(false)
const userTreeData = ref<any[]>([])
const userTreeRef = ref<InstanceType<typeof ElTree>>()

// 🌟 新增：搜索相关逻辑
const userSearchQuery = ref('')
watch(userSearchQuery, (val) => {
  // 只有当树组件的 DOM 实例确实存在时，才执行过滤
  if (userTreeRef.value) {
    userTreeRef.value.filter(val)
  }
})
const filterNode = (value: string, data: any) => {
  if (!value) return true
  // 匹配名称或账号
  return data.name.includes(value) || (data.extCode && data.extCode.includes(value))
}

const openAssignUsers = async (row: any) => {
  userSearchQuery.value = '' // 打开时清空搜索
  currentRow.value = row
  drawerUserVisible.value = true
  drawerLoading.value = true
  try {
    const [treeRes, assignedIds] = await Promise.all([
      getSystemUserTreeApi(),
      getRoleUsersApi(row.id)
    ])
    userTreeData.value = treeRes || []

    // 组装回显用的 Keys
    const keysToEcho = (assignedIds || []).map((id: number) => `U_${id}`)
    setTimeout(() => {
      if (userTreeRef.value) userTreeRef.value.setCheckedKeys(keysToEcho)
    }, 50)
  } finally {
    drawerLoading.value = false
  }
}

const submitAssignUsers = async () => {
  if (!userTreeRef.value) return
  submitLoading.value = true
  try {
    const checkedKeys = userTreeRef.value.getCheckedKeys(false) as string[]
    const userIds = checkedKeys
      .filter(key => key.startsWith('U_'))
      .map(key => parseInt(key.replace('U_', ''), 10))

    await assignUsersApi({ id: currentRow.value.id, userIds })
    ElMessage.success('用户分配成功！后台已自动刷新涉及人员的版本戳。')
    drawerUserVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

// ================== 4. 抽屉 B：分配功能权限 ==================
const drawerPermVisible = ref(false)
const permTreeData = ref<any[]>([])
const permTreeRef = ref<InstanceType<typeof ElTree>>()

const openAssignPerms = async (row: any) => {
  currentRow.value = row
  drawerPermVisible.value = true
  drawerLoading.value = true
  try {
    const [treeRes, assignedIds] = await Promise.all([
      getPermissionTreeApi(),
      getRolePermsApi(row.id)
    ])
    permTreeData.value = treeRes || []

    // 仅提取"叶子节点"用于回显
    const getLeafIds = (nodes: any[], validKeys: number[]): number[] => {
      let leafs: number[] = []
      nodes.forEach(node => {
        if (!node.children || node.children.length === 0) {
          if (validKeys.includes(node.id)) leafs.push(node.id)
        } else {
          leafs = leafs.concat(getLeafIds(node.children, validKeys))
        }
      })
      return leafs
    }

    const leafIds = getLeafIds(permTreeData.value, assignedIds || [])
    setTimeout(() => {
      if (permTreeRef.value) permTreeRef.value.setCheckedKeys(leafIds)
    }, 50)
  } finally {
    drawerLoading.value = false
  }
}

const submitAssignPerms = async () => {
  if (!permTreeRef.value) return
  submitLoading.value = true
  try {
    // 获取全选和半选的节点
    const checked = permTreeRef.value.getCheckedKeys() as number[]
    const halfChecked = permTreeRef.value.getHalfCheckedKeys() as number[]
    const permissionIds = [...checked, ...halfChecked]

    await assignPermsApi({ id: currentRow.value.id, permissionIds })
    ElMessage.success('功能权限与字段规则已生效！')
    drawerPermVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

// ================== 5. 🌟 抽屉 C：分配数据规则 ==================
const drawerRuleVisible = ref(false)
const allRulesData = ref<any[]>([])
const ruleTableRef = ref<InstanceType<typeof ElTable>>()
const selectedRuleIds = ref<number[]>([])

// 记录用户勾选的规则 ID
const handleRuleSelection = (selection: any[]) => {
  selectedRuleIds.value = selection.map(item => item.id)
}

const openAssignRules = async (row: any) => {
  currentRow.value = row
  drawerRuleVisible.value = true
  drawerLoading.value = true
  try {
    // 并行获取全量规则列表 和 该角色已绑定的规则ID
    const [rulesRes, assignedIds] = await Promise.all([
      getAllDataRulesApi(),
      getRoleRulesApi(row.id)
    ])
    allRulesData.value = rulesRes || []

    // 🌟 回显逻辑：遍历表格数据，如果 ID 在 assignedIds 中，则设为选中状态
    setTimeout(() => {
      if (ruleTableRef.value) {
        ruleTableRef.value.clearSelection()
        allRulesData.value.forEach(rule => {
          if ((assignedIds || []).includes(rule.id)) {
            ruleTableRef.value!.toggleRowSelection(rule, true)
          }
        })
      }
    }, 50)
  } finally {
    drawerLoading.value = false
  }
}

const submitAssignRules = async () => {
  submitLoading.value = true
  try {
    // 提交选择的 rule IDs (来自 handleRuleSelection 的记录)
    await assignRulesApi({
      id: currentRow.value.id,
      dataRuleIds: selectedRuleIds.value
    })
    ElMessage.success('数据范围过滤规则分配成功！')
    drawerRuleVisible.value = false
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.app-container { height: 100%; display: flex; flex-direction: column; }
.table-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

:deep(.table-card .el-card__body) {
  flex: 1; overflow: hidden; display: flex; flex-direction: column; padding: 15px;
}

.card-header {
  display: flex; justify-content: space-between; align-items: center; font-weight: bold;
}

.action-buttons {
  display: flex; justify-content: center; gap: 8px; white-space: nowrap;
}

.drawer-content {
  height: calc(100vh - 140px); /* 留出底部按钮高度 */
  overflow-y: auto;
  padding: 0 10px;
}

/* 树节点样式复用 */
.custom-tree-node {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  line-height: 32px;
}

.mr-2 { margin-right: 8px; }
.is-dept { font-weight: 600; color: var(--el-text-color-primary); }
.node-ext-code { color: #909399; margin-left: 8px; font-size: 13px; }
</style>
