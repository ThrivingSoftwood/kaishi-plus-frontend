<template>
  <div class="app-container">
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户与组织架构管理</span>
          <!-- 🌟 增加搜索和按钮区域组 -->
          <div style="display: flex; gap: 10px;">
            <el-input v-model="tableSearchQuery" placeholder="搜索本地部门或人员" clearable prefix-icon="Search" style="width: 200px;" />
            <el-button type="primary" icon="Download" @click="openSyncDialog">
              引入管家婆人员
            </el-button>
          </div>
        </div>
      </template>

      <!-- 🌟 将 :data="userTree" 改为 :data="filteredUserTree" -->
      <el-table
        v-loading="loading"
        :data="filteredUserTree"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column label="名称 (部门/人员)" min-width="250">
          <template #default="{ row }">
            <!-- 🌟 这里的 container 必须保持 inline-flex 或控制好布局 -->
            <div class="org-cell-content">
              <el-icon v-if="row.nodeType === 1" color="#E6A23C" size="18" class="node-icon">
                <FolderOpened/>
              </el-icon>
              <el-icon v-else color="#409EFF" size="18" class="node-icon">
                <User/>
              </el-icon>

              <span class="node-name" :class="{ 'is-dept': row.nodeType === 1 }">
                {{ row.name }}
                <!-- 🌟 仅在部门节点后显示人数 -->
                <span v-if="row.nodeType === 1" class="user-count-badge">
                  ({{ row.userCount || 0 }})
                </span>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="extCode" label="登录账号 / 员工编号" width="180" align="center"/>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <!-- 只有用户节点才可以修改状态 -->
            <el-switch
              v-if="row.nodeType === 2"
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.nodeType === 2">
              <el-button type="primary" link icon="Key" @click="openRoleDialog(row)">角色</el-button>
              <el-button type="warning" link icon="Lock" @click="openPwdDialog(row)">重置密码
              </el-button>

              <el-dropdown trigger="click" style="margin-left: 12px; vertical-align: middle;">
                <el-button type="info" link icon="MoreFilled">更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      class="text-danger"
                      icon="Delete"
                      @click="handleDelete(row)"
                    >
                      移除用户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>


    <!-- 在页面底部追加一个分配角色的 Dialog -->
    <el-dialog
      :title="`为【${currentTargetUserName}】分配角色`"
      v-model="roleDialogVisible"
      width="500px"
      destroy-on-close
    >
      <div v-loading="roleDialogLoading">
        <el-checkbox-group v-model="selectedRoleIds">
          <!-- allRoles 是从 getRolesApi 拉取的所有可用角色 -->
          <el-checkbox
            v-for="role in allRoles"
            :key="role.id"
            :label="role.id"
          >
            {{ role.roleName }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleSubmitLoading" @click="submitAssignRoles">
          确定分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 🌟 管家婆人员同步弹窗 -->
    <el-dialog
      title="从管家婆引入人员"
      v-model="syncDialogVisible"
      width="600px"
      destroy-on-close
    >
      <div v-loading="syncLoading">
        <div v-if="unsyncedTree.length === 0 && !syncLoading" class="empty-hint">
          <el-empty description="所有管家婆在职人员均已开通账号"/>
        </div>

        <template v-else>
          <!-- 🌟 新增：初始密码设置表单 -->
          <el-form ref="syncFormRef" :model="syncForm" :rules="syncRules" label-width="90px">
            <el-alert title="勾选部门可自动全选该部门及子部门下的所有人员" type="info" show-icon
                      style="margin-bottom: 15px;"/>
            <el-form-item label="初始密码" prop="initPassword">
              <el-input
                v-model="syncForm.initPassword"
                type="password"
                show-password
                placeholder="请为本次引入的人员设置统一的初始登录密码"
              />
            </el-form-item>
          </el-form>

          <!-- 混合树：移除 disabled 属性绑定，允许部门级联勾选 -->
          <div class="sync-tree-wrapper">
            <!-- 🌟 新增搜索框 -->
            <el-input v-model="erpSearchQuery" placeholder="输入名称或账号快捷筛选" clearable prefix-icon="Search" style="margin-bottom: 10px;" />
            <el-tree
              ref="erpTreeRef"
              :data="unsyncedTree"
              :filter-node-method="filterErpNode"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              show-checkbox
              default-expand-all
            >
              <!-- 🌟 自定义树节点内容 -->
              <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-icon v-if="data.nodeType === 1" color="#E6A23C"><Folder/></el-icon>
              <el-icon v-else color="#409EFF"><User/></el-icon>

              <span class="node-label-wrapper">
                <span class="node-name">{{ node.label }}</span>

                <!-- 🌟 针对部门节点，追加显示待同步人数 -->
                <span v-if="data.nodeType === 1" class="user-count-tag">
                  ({{ data.userCount || 0 }})
                </span>

                <!-- 员工节点继续显示账号 -->
                <span v-if="data.nodeType === 2" class="node-ext-code">
                  ({{ data.extCode }})
                </span>
              </span>
            </span>
              </template>
            </el-tree>
          </div>
        </template>
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
            确认引入并开通账号
          </el-button>
        </span>
      </template>
    </el-dialog>


    <!-- 🌟 重置密码弹窗 -->
    <el-dialog title="强制重置密码" v-model="pwdDialogVisible" width="400px" destroy-on-close>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-alert title="重置后用户将立刻被强制下线" type="warning" show-icon
                  style="margin-bottom: 15px;"/>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password
                    placeholder="请输入不少于6位的新密码"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="pwdSubmitLoading" @click="submitResetPwd">确认重置
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import type { ElTree, FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Folder, FolderOpened, User } from '@element-plus/icons-vue'
import { encryptPassword } from '@/utils/sm4'

// 🌟 引入用户相关 API
import {
  deleteUserApi,
  getErpUnsyncedUserTreeApi,
  getSystemUserTreeApi,
  type OrgNodeVO,
  resetUserPwdApi,
  syncUsersApi,
  updateUserApi,
  // 以下为新增 API
  getUserRolesApi,
  assignRolesToUserApi
} from '@/api/system/user'

// 🌟 引入角色相关 API (用于拉取角色备选列表)
import { getRolesApi } from '@/api/system/role'

// --- 1. 主页面基础状态 ---
const loading = ref(false)
const userTree = ref<OrgNodeVO[]>([])
const tableSearchQuery = ref('')


// 🌟 核心：递归深拷贝过滤树 (保证不破坏原数据，且只要子节点匹配，父节点自动保留)
const filteredUserTree = computed(() => {
  if (!tableSearchQuery.value) return userTree.value
  const query = tableSearchQuery.value.toLowerCase()

  const filterTree = (nodes: OrgNodeVO[]): OrgNodeVO[] => {
    return nodes.map(node => ({ ...node })) // 浅拷贝一层，防止修改原数据引用
      .filter(node => {
        // 1. 检查自己是否匹配
        const isMatch = node.name.toLowerCase().includes(query) ||
          (node.extCode && node.extCode.toLowerCase().includes(query))

        // 2. 递归检查子节点
        if (node.children && node.children.length > 0) {
          node.children = filterTree(node.children)
        }

        // 3. 只要自己匹配，或者有存活的子节点，这个节点就保留
        return isMatch || (node.children && node.children.length > 0)
      })
  }
  return filterTree(userTree.value)
})

const fetchUserTree = async () => {
  loading.value = true
  try {
    const res = await getSystemUserTreeApi()
    userTree.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchUserTree())

// 剥离 "U_" 前缀提取真实 ID
const extractUserId = (nodeId: string): number => {
  return parseInt(nodeId.replace('U_', ''), 10)
}

// 状态切换逻辑
const handleStatusChange = async (row: OrgNodeVO) => {
  const realId = extractUserId(row.id)
  try {
    await updateUserApi({ id: realId, status: row.status })
    ElMessage.success(row.status === 1 ? '账号已启用' : '账号已停用，用户将被强制下线')
  } catch (error) {
    console.error(error)
    // 失败回滚开关状态
    row.status = row.status === 1 ? 0 : 1
  }
}

// 删除账号逻辑
const handleDelete = (row: OrgNodeVO) => {
  ElMessageBox.confirm(`确定要彻底移除用户【${row.name}】吗？该操作不可逆！`, '高危操作', { type: 'error' })
    .then(async () => {
      const realId = extractUserId(row.id)
      const msg = await deleteUserApi(realId)
      ElMessage.success(msg || '删除成功')
      fetchUserTree()
    })
}

// --- 2. 🌟 核心：分配角色逻辑 ---
const roleDialogVisible = ref(false)
const roleDialogLoading = ref(false)
const roleSubmitLoading = ref(false)
const currentTargetUserName = ref('')
const currentTargetUserId = ref<number>(0)
const selectedRoleIds = ref<number[]>([]) // 已选中的角色 ID 列表
const allRoles = ref<any[]>([])           // 系统所有可用的角色列表

/**
 * 打开角色分配弹窗
 */
const openRoleDialog = async (row: OrgNodeVO) => {
  const realId = extractUserId(row.id)
  currentTargetUserId.value = realId
  currentTargetUserName.value = row.name

  // 初始化弹窗状态
  selectedRoleIds.value = []
  roleDialogVisible.value = true
  roleDialogLoading.value = true

  try {
    // 🚀 性能优化：并行请求全部角色和该用户已拥有的角色
    const [rolesRes, assignedRes] = await Promise.all([
      getRolesApi(),
      getUserRolesApi(realId)
    ])

    // 过滤掉停用的角色，仅展示正常状态的角色供分配
    allRoles.value = (rolesRes || []).filter((r: any) => r.status === 1)

    // 数据回显：设置 Checkbox 选中的 ID
    selectedRoleIds.value = assignedRes || []
  } catch (error) {
    console.error('获取角色信息失败:', error)
  } finally {
    roleDialogLoading.value = false
  }
}

/**
 * 提交角色分配
 */
const submitAssignRoles = async () => {
  if (currentTargetUserId.value === 0) return

  roleSubmitLoading.value = true
  try {
    await assignRolesToUserApi({
      id: currentTargetUserId.value,
      roleIds: selectedRoleIds.value
    })

    ElMessage.success({
      message: `用户【${currentTargetUserName.value}】角色分配成功！相关权限将在 60 秒内生效。`,
      duration: 5000,
      showClose: true
    })
    roleDialogVisible.value = false
  } catch (error) {
    console.error('分配角色失败:', error)
  } finally {
    roleSubmitLoading.value = false
  }
}

// --- 3. 同步弹窗逻辑 (保持原有逻辑) ---
const syncDialogVisible = ref(false)
const syncLoading = ref(false)
const submitSyncLoading = ref(false)
const unsyncedTree = ref<OrgNodeVO[]>([])
const erpTreeRef = ref<InstanceType<typeof ElTree>>()
// --- 🌟 同步弹窗状态扩展 ---
const syncFormRef = ref<FormInstance>()
const syncForm = reactive({ initPassword: '' })
const syncRules = reactive<FormRules>({
  initPassword: [
    { required: true, message: '必须设置初始密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 🌟 新增：搜索相关逻辑
const erpSearchQuery = ref('')
watch(erpSearchQuery, (val) => {
  if (erpTreeRef.value) {
    erpTreeRef.value.filter(val)
  }
})
const filterErpNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.includes(value) || (data.extCode && data.extCode.includes(value))
}

const openSyncDialog = async () => {
  erpSearchQuery.value = '' // 打开时清空搜索
  syncForm.initPassword = ''
  if (syncFormRef.value) syncFormRef.value.resetFields()
  syncDialogVisible.value = true
  syncLoading.value = true
  try {
    const res = await getErpUnsyncedUserTreeApi()
    unsyncedTree.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    syncLoading.value = false
  }
}

const submitSync = async () => {
  if (!erpTreeRef.value || !syncFormRef.value) return

  // 1. 获取所有打勾的节点 ID (包含半选的父节点，确保级联完全)
  // 参数 true 表示：不包含半选节点。因为我们只要纯粹的叶子(员工)节点。
  const checkedKeys = erpTreeRef.value.getCheckedKeys(false) as string[]

  // 2. 过滤出真正的人员 ID（以 E_ 开头），并剥离前缀恢复为 ERP 的 typeid
  const erpEmployeeTypeIds = checkedKeys
    .filter(key => key.startsWith('E_'))
    .map(key => key.replace('E_', ''))

  if (erpEmployeeTypeIds.length === 0) {
    return ElMessage.warning('请在下方树形结构中至少勾选一位人员')
  }

  // 3. 校验密码表单
  await syncFormRef.value.validate(async (valid) => {
    if (valid) {
      submitSyncLoading.value = true
      try {
        await syncUsersApi({
          erpEmployeeTypeIds,
          // 🌟 发送 SM4 加密后的动态初始密码 (复用 DTO 的 newPasswordEnc 字段)
          newPasswordEnc: encryptPassword(syncForm.initPassword)
        })
        ElMessage.success(`成功引入 ${erpEmployeeTypeIds.length} 名人员！`)
        syncDialogVisible.value = false
        fetchUserTree()
      } catch (error) {
        console.error(error)
      } finally {
        submitSyncLoading.value = false
      }
    }
  })
}

// --- 4. 重置密码逻辑 (保持原有逻辑) ---
const pwdDialogVisible = ref(false)
const pwdSubmitLoading = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({ newPassword: '' })
const pwdRules = reactive<FormRules>({
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, message: '密码不能少于6位', trigger: 'blur' }
  ]
})

const openPwdDialog = (row: OrgNodeVO) => {
  currentTargetUserId.value = extractUserId(row.id)
  pwdForm.newPassword = ''
  if (pwdFormRef.value) pwdFormRef.value.resetFields()
  pwdDialogVisible.value = true
}

const submitResetPwd = async () => {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate(async (valid) => {
    if (valid) {
      pwdSubmitLoading.value = true
      try {
        await resetUserPwdApi({
          id: currentTargetUserId.value,
          // 🌟 SM4 动态加密，与登录共用同一套底层机制
          newPasswordEnc: encryptPassword(pwdForm.newPassword)
        })
        ElMessage.success('密码重置成功')
        pwdDialogVisible.value = false
      } finally {
        pwdSubmitLoading.value = false
      }
    }
  })
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

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.node-ext-code {
  color: #909399;
  margin-left: 8px;
  font-size: 13px;
}

/* 🌟 核心修复：强制展开箭头与内容在同一行垂直居中 */
:deep(.el-table__row--level-0),
:deep(.el-table__row--level-1),
:deep(.el-table__row--level-2) {
  /* 确保行高一致 */
}

/* 针对第一个单元格的内部布局控制 */
.org-cell-content {
  display: inline-flex; /* 使用 inline-flex 防止占据整行导致箭头换行 */
  align-items: center;
  vertical-align: middle;
  line-height: 23px; /* 与 Element 默认行高一致 */
}

.node-icon {
  margin-right: 8px;
  flex-shrink: 0; /* 防止图标被挤压 */
}

.node-name {
  white-space: nowrap; /* 防止名称换行 */
}

.is-dept {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.user-count-badge {
  color: #909399; /* 柔和的灰色显示人数 */
  font-size: 13px;
  font-weight: normal;
  margin-left: 4px;
}

/* 🌟 修正展开箭头的位置（如果它依然偏上） */
:deep(.el-table__placeholder) {
  display: none; /* 隐藏占位符，减少间距干扰 */
}

:deep(.el-table__expand-icon) {
  height: 23px; /* 匹配内容高度 */
  display: inline-flex;
  align-items: center;
  margin-right: 4px; /* 给箭头和图标之间留点呼吸空间 */
}

/* 弹窗中树节点的样式微调 */
.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
  width: 100%; /* 确保撑满 */
}

.node-label-wrapper {
  margin-left: 8px;
  display: flex;
  align-items: center;
}

.user-count-tag {
  color: var(--el-color-info); /* 使用 Element Plus 的标准信息色（灰色） */
  font-size: 12px;
  margin-left: 6px;
  font-weight: normal;
}

.node-name {
  /* 可以在这里针对部门加粗，例如： */
  /* font-weight: 500; */
}

.node-ext-code {
  color: #909399;
  margin-left: 8px;
  font-size: 13px;
}

/* 🌟 核心：统一表格行高，确保视觉节奏一致 */

/* 1. 针对单元格内部容器的统一高度控制 */
.org-cell-content {
  display: inline-flex;
  align-items: center;
  /* 增加最小高度，40px-48px 是管理后台的黄金行高 */
  min-height: 40px;
  vertical-align: middle;
}

/* 2. 移除 Element Table 默认的内边距干扰，改用我们自定义的受控高度 */
:deep(.el-table .el-table__cell) {
  padding: 4px 0; /* 适当减小默认 padding，由内部内容撑开 */
}

/* 3. 针对部门行（nodeType=1）进行视觉加固 */
.is-dept {
  font-weight: 600;
  font-size: 15px; /* 部门字体稍微大一点，拉开层级感 */
  color: var(--el-text-color-primary);
  /* 确保文本也有足够的行高支撑 */
  line-height: 40px;
}

/* 4. 针对用户行，由于包含了 Switch 和 Button，我们需要确保它们不撑破容器 */
:deep(.el-switch) {
  height: 32px; /* 限制开关高度 */
}

/* 5. 🌟 极重要：修正展开箭头在高度增加后的居中问题 */
:deep(.el-table__expand-icon) {
  height: 40px !important; /* 必须匹配上面的 min-height */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

/* 6. 修整弹窗中的树节点高度，保持风格统一 */
.custom-tree-node {
  height: 36px; /* 树节点通常比表格行稍矮一点，更显精致 */
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  /* 强制按钮不换行 */
  white-space: nowrap;
  /* 给按钮之间留出固定间距 */
  gap: 8px;
}

/* 覆盖 Element 默认的 link 按钮外边距，改用 gap 控制 */
:deep(.action-buttons .el-button + .el-button) {
  margin-left: 0;
}
</style>
