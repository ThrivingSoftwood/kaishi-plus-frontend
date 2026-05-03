<template>
  <div v-loading="loading" class="logistics-detail-container">
    <!-- ================= 1. 顶部操作栏 ================= -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBackList">
        <template #content>
          <span class="header-title">{{ pageTitle }}</span>
        </template>
        <template #extra>
          <div class="actions">
            <el-button @click="goBackList">返回列表</el-button>
            <el-button v-if="!isEditing" v-hasPerm="'logistics:edit'" icon="Edit" type="warning"
                       @click="startEdit">进入编辑
            </el-button>
            <template v-else>
              <el-button @click="cancelEdit">取消编辑</el-button>
              <el-button :loading="submitting" type="primary" @click="handleSave">保存发货数据
              </el-button>
            </template>
          </div>
        </template>
      </el-page-header>
    </el-card>

    <el-form ref="formRef" :disabled="!isEditing" :model="formData.logistics" :rules="rules"
             label-position="top" label-width="130px">

      <!-- ================= 2. 发货主信息 (全业务字段覆盖) ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon>
              <Van/>
            </el-icon>
            <span>发货物流主信息</span></div>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="E采订单号" prop="eOrderId">
              <!-- E采订单号为业务主键核心，仅新增时可填 -->
              <el-input v-model="formData.logistics.eOrderId" :disabled="mode !== 'new'"
                        placeholder="关联的E采订单号"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发货单ID (Package)" prop="packageId">
              <el-input v-model="formData.logistics.packageId" placeholder="发货单ID"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="订单金额" prop="orderPrice">
              <el-input-number v-model="formData.logistics.orderPrice" :min="0" :precision="2"
                               controls-position="right" style="width: 100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="订单类型" prop="orderType">
              <el-select v-model="formData.logistics.orderType" placeholder="选择订单类型"
                         style="width: 100%">
                <el-option :value="1" label="母订单"/>
                <el-option :value="2" label="子订单"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="物流状态" prop="logisticsState">
              <el-select v-model="formData.logistics.logisticsState" placeholder="选择物流状态"
                         style="width: 100%">
                <el-option :value="0" label="新建"/>
                <el-option :value="5" label="已出库"/>
                <el-option :value="1" label="妥投完成"/>
                <el-option :value="-1" label="拒收"/>
                <el-option :value="-2" label="已取消"/>
                <el-option :value="4" label="退换货中"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="处理状态" prop="submitState">
              <el-select v-model="formData.logistics.submitState" placeholder="选择处理状态"
                         style="width: 100%">
                <el-option :value="0" label="未确认"/>
                <el-option :value="1" label="已确认"/>
                <el-option :value="-1" label="取消"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物流类型" prop="type">
              <el-select v-model="formData.logistics.type" placeholder="选择类型"
                         style="width: 100%">
                <el-option :value="0" label="订单物流"/>
                <el-option :value="1" label="发票物流"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="签收时间" prop="receiveTime">
              <!-- 支持带时分秒的日期格式修改 -->
              <el-date-picker v-model="formData.logistics.receiveTime" placeholder="选择签收时间"
                              style="width: 100%" type="datetime"
                              value-format="YYYY-MM-DDTHH:mm:ss"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="物流公司" prop="expressCompany">
              <el-input v-model="formData.logistics.expressCompany" placeholder="如：顺丰速运"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="物流运单号" prop="expressNo">
              <el-input v-model="formData.logistics.expressNo" placeholder="请输入运单号"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发票编码" prop="invoiceCode">
              <el-input v-model="formData.logistics.invoiceCode" placeholder="请输入发票编码"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="发票号码" prop="invoiceNo">
              <el-input v-model="formData.logistics.invoiceNo" placeholder="请输入发票号码"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>

    <!-- ================= 3. 包裹商品明细 (纯展示) ================= -->
    <el-card v-if="mode !== 'new'" class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Box/>
          </el-icon>
          <span>包裹商品明细</span></div>
      </template>
      <el-table :data="formData.items" border stripe>
        <el-table-column align="center" label="序号" type="index" width="60"/>
        <el-table-column label="商品SKU" min-width="160" prop="sku"/>
        <el-table-column align="center" label="发货数量" prop="num" width="120">
          <template #default="{ row }"><span style="font-weight: bold;">{{ row.num }}</span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="含税单价" prop="price" width="120"/>
        <el-table-column align="center" label="签收数量" prop="signedCount" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.signedCount" type="success">{{ row.signedCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="right" label="签收金额" prop="signedAmount" width="120"/>
      </el-table>
    </el-card>

    <!-- ================= 4. 物流运转轨迹 (纯展示) ================= -->
    <el-card v-if="mode !== 'new'" class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Position/>
          </el-icon>
          <span>物流运转轨迹</span></div>
      </template>
      <el-timeline v-if="formData.tracks && formData.tracks.length > 0" style="padding-top: 10px;">
        <el-timeline-item
          v-for="(track, index) in formData.tracks"
          :key="index"
          :hollow="index !== 0"
          :timestamp="track.operateTime?.replace('T', ' ')"
          :type="index === 0 ? 'primary' : 'info'"
        >
          <div style="font-weight: 500; color: var(--el-text-color-primary); margin-bottom: 4px;">
            {{ track.content }}
          </div>
          <div style="font-size: 12px; color: var(--el-text-color-secondary);">操作人:
            {{ track.operator || '系统' }}
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无轨迹信息"/>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Box, Position, Van} from '@element-plus/icons-vue'
import {getLogisticsDetailApi, saveLogisticsApi, updateLogisticsApi} from '../api/logistics'

defineOptions({name: 'EdongfangLogisticsDetail'})

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const mode = computed(() => route.params.mode as 'new' | 'edit' | 'view')
const pk = computed(() => route.params.pk as string)

const isEditing = ref(mode.value === 'new')
const pageTitle = computed(() => {
  if (mode.value === 'new') return '新增发货单'
  if (isEditing.value) return '编辑发货资料'
  return '发货详情展示'
})

// 表单数据，已补齐所有可编辑的业务字段
const formData = reactive({
  logistics: {
    pk: '', eOrderId: '', logisticsState: 0, submitState: 0, packageId: '', orderPrice: 0,
    orderType: 1, expressCompany: '', expressNo: '', invoiceNo: '', invoiceCode: '',
    type: 0, receiveTime: ''
  },
  items: [],
  tracks: []
})

onMounted(async () => {
  if (mode.value !== 'new' && pk.value) {
    await fetchDetail()
  }
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getLogisticsDetailApi(pk.value)
    Object.assign(formData.logistics, res.logistics || {})
    formData.items = res.items || []
    formData.tracks = res.tracks || []
  } finally {
    loading.value = false
  }
}

const startEdit = () => isEditing.value = true
const cancelEdit = async () => {
  if (mode.value === 'new') {
    goBackList()
  } else {
    isEditing.value = false
    await fetchDetail() // 还原本地修改
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        if (mode.value === 'new') {
          await saveLogisticsApi(formData.logistics)
          ElMessage.success('发货单创建成功')
          isEditing.value = false
          goBackList()
        } else {
          await updateLogisticsApi(formData.logistics)
          ElMessage.success('发货资料更新成功')
          isEditing.value = false
          await fetchDetail() // 重新拉取以刷新修改日期等字段
        }
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('请完善必填信息')
    }
  })
}

const goBackList = () => router.push('/edongfang/order/logistics')

const rules = {
  eOrderId: [{required: true, message: '请绑定E采订单号', trigger: 'blur'}],
  logisticsState: [{required: true, message: '请选择物流状态', trigger: 'change'}],
  submitState: [{required: true, message: '请选择处理状态', trigger: 'change'}]
}
</script>

<style scoped>
.logistics-detail-container {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--el-bg-color-page);
  min-height: calc(100vh - 120px);
}

.header-card {
  position: sticky;
  top: 0;
  z-index: 100;
  border-radius: 0 0 8px 8px;
  border: none;
  border-bottom: 1px solid var(--el-border-color-darker);
  margin: -20px -20px 0 -20px;
  padding: 0 20px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-card {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-darker);
  background-color: var(--el-bg-color-overlay);
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-header .el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: var(--el-color-primary);
}

.actions {
  display: flex;
  gap: 12px;
}

:deep(.el-input.is-disabled .el-input__inner) {
  -webkit-text-fill-color: var(--el-text-color-regular);
  color: var(--el-text-color-regular);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 8px !important;
}
</style>
