<template>
  <div class="app-container">
    <!-- 1. 规则列表区 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>数据范围规则引擎 (ABAC 策略中心)</span>
          <!-- 🌟 增加并联搜索框 -->
          <div style="display: flex; gap: 10px;">
            <el-input v-model="searchResource" placeholder="搜索目标表/资源" clearable prefix-icon="Search" style="width: 180px;" />
            <el-input v-model="searchName" placeholder="搜索规则名称" clearable prefix-icon="Search" style="width: 180px;" />
            <el-button type="primary" icon="Plus" @click="openDialog(null)">新建规则</el-button>
          </div>
        </div>
      </template>

      <!-- 🌟 将 :data="ruleList" 改为 :data="filteredRuleList" -->
      <el-table v-loading="loading" :data="filteredRuleList" border stripe height="calc(100vh - 200px)">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="targetResource" label="受控目标表/资源" width="180">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.targetResource }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ruleName" label="规则名称" min-width="180" />

        <el-table-column prop="scopeType" label="策略类型" width="160" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.scopeType===1" type="success">全部数据</el-tag>
            <el-tag v-else-if="row.scopeType===2" type="info">仅看本人</el-tag>
            <el-tag v-else-if="row.scopeType===3" type="warning">本部门</el-tag>
            <el-tag v-else-if="row.scopeType===4" type="warning" effect="dark">本部门及下属</el-tag>
            <el-tag v-else-if="row.scopeType===5" type="danger">高级自定义条件</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="customSqlJson" label="底层 SQL JSON" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.scopeType === 5" style="color: #909399; font-family: monospace;">
              {{ row.customSqlJson }}
            </span>
            <span v-else style="color: #C0C4CC;">(内置策略，无需JSON)</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link icon="Edit" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 2. 🌟 核心：可视化规则配置弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="680px" destroy-on-close>
      <el-form ref="ruleFormRef" :model="ruleForm" :rules="ruleRules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" placeholder="如: 仅限华东区A仓库" />
        </el-form-item>

        <el-form-item label="目标资源" prop="targetResource">
          <!-- 这里的 value 需要与你 MyBatis-Plus 拦截器里提取的 ResourceName 严格匹配 -->
          <!-- todo 获取目标表 todo 后续有需要扩展成字典表,从后台获取数据后填充到这里 -->
          <el-select v-model="ruleForm.targetResource" placeholder="请选择要挂载拦截器的业务表" style="width: 100%">
            <el-option label="采购订单 (DlyBuy)" value="DlyBuy" />
            <el-option label="库存实绩 (Dlystock)" value="Dlystock" />
            <!-- 可以根据系统模块继续追加 -->
          </el-select>
        </el-form-item>

        <el-form-item label="规则类型" prop="scopeType">
          <el-select v-model="ruleForm.scopeType" style="width: 100%">
            <el-option label="1 - 全部数据 (不拦截)" :value="1" />
            <el-option label="2 - 仅看本人数据" :value="2" />
            <el-option label="3 - 仅看本部门数据" :value="3" />
            <el-option label="4 - 本部门及下属" :value="4" />
            <el-option label="5 - ⚙️ 高级自定义条件 (可视化生成)" :value="5" />
          </el-select>
        </el-form-item>

        <!-- 🌟 可视化条件构建器 (仅当选了 5 时展示) -->
        <template v-if="ruleForm.scopeType === 5">
          <el-divider content-position="left">可视化条件构建器 (多条件为 AND 关系)</el-divider>

          <div v-for="(cond, index) in conditions" :key="index" class="condition-row">
            <!-- 列名 -->
            <el-input v-model="cond.column" placeholder="表别名.列名 (如 a.ktypeid)" style="width: 180px" />

            <!-- 操作符 -->
            <el-select v-model="cond.operator" style="width: 110px; margin: 0 8px;">
              <el-option label="等于 =" value="=" />
              <el-option label="包含 IN" value="IN" />
              <el-option label="不含 NOT IN" value="NOT IN" />
              <el-option label="大于 >" value=">" />
              <el-option label="小于 <" value="<" />
            </el-select>

            <!-- 值 -->
            <el-input v-model="cond.value" placeholder="值(IN查询需加单引号)" style="flex: 1" />

            <!-- 删除条件 -->
            <el-button type="danger" link icon="Delete" style="margin-left: 8px" @click="removeCondition(index)" />
          </div>

          <el-button type="primary" plain icon="Plus" style="margin-top: 10px; width: 100%" @click="addCondition">
            添加查询条件
          </el-button>
        </template>

      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getAllDataRulesApi, saveDataRuleApi, deleteDataRuleApi, type DataRuleReq } from '@/api/system/dataRule'

const loading = ref(false)
const ruleList = ref<any[]>([])

// 🌟 新增：双维度搜索状态
const searchResource = ref('')
const searchName = ref('')

/**
 * 🌟 核心：双维度并联（AND）过滤计算属性
 * 逻辑：资源匹配 AND 名称匹配
 */
const filteredRuleList = computed(() => {
  return ruleList.value.filter(rule => {
    const queryRes = searchResource.value.trim().toLowerCase()
    const queryName = searchName.value.trim().toLowerCase()

    // 1. 受控资源匹配：为空放行，不为空则执行包含检查
    const matchResource = !queryRes || (rule.targetResource && rule.targetResource.toLowerCase().includes(queryRes))

    // 2. 规则名称匹配：同理
    const matchName = !queryName || (rule.ruleName && rule.ruleName.toLowerCase().includes(queryName))

    // 3. 并联逻辑
    return matchResource && matchName
  })
})

const fetchRules = async () => {
  loading.value = true
  try {
    const res = await getAllDataRulesApi()
    ruleList.value = res || []
  } finally {
    loading.value = false
  }
}
onMounted(() => fetchRules())

const dialogVisible = ref(false)
const dialogTitle = ref('新建规则')
const submitLoading = ref(false)
const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive<DataRuleReq>({
  id: null,
  ruleName: '',
  targetResource: '',
  scopeType: 1,
  customSqlJson: ''
})

// 🌟 存放可视化组件状态的响应式数组
const conditions = ref([
  { column: '', operator: '=', value: '' }
])

const ruleRules = reactive<FormRules>({
  ruleName: [{ required: true, message: '规则名称不能为空', trigger: 'blur' }],
  targetResource: [{ required: true, message: '必须指定受控资源表', trigger: 'change' }]
})

const addCondition = () => {
  conditions.value.push({ column: '', operator: '=', value: '' })
}

const removeCondition = (index: number) => {
  conditions.value.splice(index, 1)
}

const openDialog = (row: any) => {
  if (ruleFormRef.value) ruleFormRef.value.resetFields()

  if (row) {
    dialogTitle.value = '编辑数据规则'
    Object.assign(ruleForm, row)

    // 🌟 回显逻辑：如果是高级自定义，将 JSON 字符串还原为对象数组驱动 UI
    if (row.scopeType === 5 && row.customSqlJson) {
      try {
        conditions.value = JSON.parse(row.customSqlJson)
      } catch (e) {
        console.error(e)
        conditions.value = [{ column: '', operator: '=', value: '' }]
      }
    } else {
      conditions.value = [{ column: '', operator: '=', value: '' }]
    }
  } else {
    dialogTitle.value = '新建数据规则'
    Object.assign(ruleForm, { id: null, ruleName: '', targetResource: '', scopeType: 1, customSqlJson: '' })
    conditions.value = [{ column: '', operator: '=', value: '' }]
  }

  dialogVisible.value = true
}

const submitForm = async () => {
  if (!ruleFormRef.value) return
  await ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 🌟 核心提交逻辑：如果是高级策略，将数组序列化为 JSON 字符串给后端
        if (ruleForm.scopeType === 5) {
          // 过滤掉空的条件行
          const validConditions = conditions.value.filter(c => c.column && c.value)
          if (validConditions.length === 0) {
            ElMessage.warning('高级自定义模式下，请至少填写一个有效的查询条件！')
            return
          }
          ruleForm.customSqlJson = JSON.stringify(validConditions)
        } else {
          // 其它模式清空 JSON 字段，保持数据库整洁
          ruleForm.customSqlJson = ''
        }

        await saveDataRuleApi(ruleForm)
        ElMessage.success('规则保存成功')
        dialogVisible.value = false
        fetchRules()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除规则【${row.ruleName}】吗？如果该规则被角色绑定，将导致对应角色的数据控制失效！`, '警告', { type: 'warning' })
    .then(async () => {
      await deleteDataRuleApi(row.id)
      ElMessage.success('删除成功')
      fetchRules()
    })
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

.condition-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  background-color: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
}
</style>
