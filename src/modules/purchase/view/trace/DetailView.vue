<!-- src/view/purchase/trace/DetailView.vue -->
<template>
  <div class="detail-container">
    <!-- 1. 顶部导航与返回 -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBack" title="返回列表">
        <template #content><span class="header-title">入库详情记录</span></template>
        <template #extra>
          <el-button
            v-if="summaryData && summaryData.statusName !== '已完成'"
            v-hasPerm="'purchase:trace:finish'"
            type="success" :icon="Check" @click="handleManualFinish"
          >置为完成</el-button>
        </template>
      </el-page-header>
    </el-card>

    <!-- 2. 采购单概览信息：配置驱动 -->
    <el-card class="info-card" shadow="never" v-loading="traceStore.isDetailLoading">
      <template #header>
        <div class="card-header">
          <span>采购单计划信息</span>
          <el-tag v-if="summaryData" :type="summaryData.statusTag as any" effect="dark">
            {{ summaryData.statusName }} (欠交: {{ summaryData.owedQty }})
          </el-tag>
        </div>
      </template>

      <el-descriptions v-if="summaryData" :column="3" border class="dark-descriptions">
        <template v-for="item in descConfig" :key="item.label">
          <el-descriptions-item
            v-if="!item.perm || authStore.hasPermission(item.perm)"
            :label="item.label"
            :span="item.span || 1"
          >
            <span :class="item.class">
              {{ item.prefix || '' }} {{ summaryData[item.prop] }}
            </span>
          </el-descriptions-item>
        </template>
      </el-descriptions>
      <el-empty v-else description="暂无采购单主信息" :image-size="100"/>
    </el-card>

    <!-- 3. 入库实绩表格：配置驱动 -->
    <el-card class="table-card" shadow="never">
      <template #header><div class="card-header"><span>历史入库实绩</span></div></template>
      <el-table v-loading="traceStore.isDetailLoading" :data="traceStore.detailList" border stripe height="calc(100vh - 620px)">
        <el-table-column type="index" label="序号" width="60" align="center"/>

        <template v-for="col in historyColumns" :key="col.prop">
          <el-table-column
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :align="col.align || 'left'"
            :show-overflow-tooltip="col.tooltip"
          >
            <template #default="{ row }" v-if="col.slot">
              <!-- 特殊列插槽处理 -->
              <template v-if="col.prop === 'bKtypeidFullname'">
                <span v-if="row.bVchcode">{{ row.bKtypeidFullname }}</span>
                <span v-else class="text-gray">无入库记录</span>
              </template>
              <template v-else-if="col.prop === 'bQty'">
                <span class="text-success">+ {{ row.bQty || 0 }}</span>
              </template>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTraceStore } from '@/modules/purchase/store/trace'
import { useAuthStore } from '@/arch/auth/store/store'
import { manualFinishPurchaseApi } from '@/modules/purchase/api/trace'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const traceStore = useTraceStore()
const authStore = useAuthStore()

// 🌟 配置驱动：Descriptions 布局
const descConfig = [
  { label: '订单编号', prop: 'number' },
  { label: '采购单号', prop: 'aVchcode' },
  { label: '详单编号', prop: 'aDlyOrder' },
  { label: '单据日期', prop: 'aDate' },
  { label: '供应商', prop: 'aBtypeidFullname', perm: 'purchase:btype:view' },
  { label: '商品名称', prop: 'aPtypeIdFullname', span: 2 },
  { label: '采购数量', prop: 'aQty', class: 'highlight-text' },
  { label: '采购单价', prop: 'aPrice', prefix: '¥', perm: 'purchase:price:view' },
]

// 🌟 配置驱动：历史表格列
const historyColumns = [
  { prop: 'bDate', label: '入库日期', width: '160', align: 'center' },
  { prop: 'bVchcode', label: '入库单号', width: '150', align: 'center' },
  { prop: 'bDlyOrder', label: '入库详单编号', width: '150', align: 'center' },
  { prop: 'bKtypeidFullname', label: '入库仓库', minWidth: '180', tooltip: true, slot: true },
  { prop: 'bQty', label: '本次入库数量', width: '150', align: 'right', slot: true },
  { prop: 'aComment', label: '摘要/备注', minWidth: '200', tooltip: true },
]

const summaryData = computed(() => {
  if (traceStore.detailList.length > 0) {
    const originalItem = traceStore.detailList[0]
    const isFromFinished = route.query.isFinished === 'true'
    if (isFromFinished) {
      return { ...originalItem, statusName: '已完成', statusTag: 'success' }
    }
    return originalItem
  }
  return null
})

const goBack = () => router.back()

const handleManualFinish = () => {
  if (!summaryData.value) return
  ElMessageBox.prompt('请输入强制置为完成的原因（选填）', '手动置为完成', {
    confirmButtonText: '确认执行',
    cancelButtonText: '取消',
    inputPlaceholder: '如：线下已结清 / 供应商折让',
    type: 'warning'
  }).then(async ({ value }) => {
    try {
      traceStore.isDetailLoading = true
      await manualFinishPurchaseApi({
        vchType: 34,
        vchCode: summaryData.value!.aVchcode,
        dlyOrder: summaryData.value!.aDlyOrder,
        extInfo: value || ''
      })
      ElMessage.success('订单已成功置为完成！')
      const sourceKey = route.query.sourceKey as string
      traceStore.removeRecordOptimistically(sourceKey, summaryData.value!.aVchcode, summaryData.value!.aDlyOrder)
      traceStore.needRefreshList = true
      setTimeout(() => goBack(), 800)
    } catch (error) {
      console.error(error)
    } finally {
      traceStore.isDetailLoading = false
    }
  }).catch(() => {})
}

onMounted(() => {
  const vchcode = Number(route.params.vchcode)
  const dlyorder = Number(route.params.dlyorder)
  if (vchcode && dlyorder) {
    traceStore.fetchDetailList({ vchcode, dlyorder })
  } else {
    goBack()
  }
})
</script>

<style scoped>
.detail-container { display: flex; flex-direction: column; gap: 16px; height: 100%; }
.header-card { border-radius: 8px; background-color: var(--el-bg-color-overlay); border: 1px solid var(--el-border-color-darker); padding: 4px 0; }
.header-title { font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); }
.info-card, .table-card { border-radius: 8px; background-color: var(--el-bg-color-overlay); border: 1px solid var(--el-border-color-darker); }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 15px; letter-spacing: 1px; }
.highlight-text { font-size: 16px; font-weight: bold; color: #409EFF; }
.text-success { color: #67c23a; font-weight: 600; }
.text-gray { color: var(--el-text-color-placeholder); font-size: 13px; }
:deep(.dark-descriptions .el-descriptions__cell) { border-color: #363637; }
:deep(.dark-descriptions .el-descriptions__label) { background-color: #1d1e1f; color: var(--el-text-color-regular); font-weight: bold; }
:deep(.el-table th.el-table__cell) { background-color: #1d1e1f; color: var(--el-text-color-primary); }
</style>
