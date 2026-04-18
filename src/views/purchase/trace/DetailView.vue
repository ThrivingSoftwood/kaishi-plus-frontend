<template>
  <div class="detail-container">
    <!-- 1. 顶部导航与返回 -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBack" title="返回列表">
        <template #content>
          <span class="header-title">入库详情记录</span>
        </template>
        <!-- 🌟 新增：操作按钮插槽 -->
        <template #extra>
          <!-- 只有在有数据，且状态不为"已完成"时才显示 -->
          <el-button
            v-if="summaryData && summaryData.statusName !== '已完成'"
            type="success"
            :icon="Check"
            @click="handleManualFinish"
          >
            置为完成
          </el-button>
        </template>
      </el-page-header>
    </el-card>

    <!-- 2. 采购单概览信息 (提取自列表的第一条数据) -->
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
        <el-descriptions-item label="订单编号">{{ summaryData.number }}</el-descriptions-item>
        <el-descriptions-item label="采购单号">{{ summaryData.aVchcode }}</el-descriptions-item>
        <el-descriptions-item label="详单编号">{{ summaryData.aDlyOrder }}</el-descriptions-item>
        <el-descriptions-item label="单据日期">{{ summaryData.aDate }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{
            summaryData.aBtypeidFullname
          }}
        </el-descriptions-item>

        <el-descriptions-item label="商品名称" :span="2">{{
            summaryData.aPtypeIdFullname
          }}
        </el-descriptions-item>
        <el-descriptions-item label="采购数量">
          <span class="highlight-text">{{ summaryData.aQty }}</span>
          <!--{{ summaryData.aUnitName }}-->
        </el-descriptions-item>
        <el-descriptions-item label="采购单价">¥ {{ summaryData.aPrice }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无采购单主信息" :image-size="100"/>
    </el-card>

    <!-- 3. 入库实绩表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>历史入库实绩</span>
        </div>
      </template>

      <el-table
        v-loading="traceStore.isDetailLoading"
        :data="traceStore.detailList"
        border
        stripe
        style="width: 100%"
        height="calc(100vh - 620px)"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="bDate" label="入库日期" width="160" align="center"/>
        <el-table-column prop="bVchcode" label="入库单号" width="150" align="center"/>
        <el-table-column prop="bDlyOrder" label="入库详单编号" width="150" align="center"/>
        <el-table-column prop="bKtypeidFullname" label="入库仓库" min-width="180"
                         show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.bVchcode" style="display: flex; align-items: center;">
              {{ row.bKtypeidFullname }}
            </span>
            <span v-else class="text-gray">无入库记录</span>
          </template>
        </el-table-column>

        <el-table-column prop="bQty" label="本次入库数量" width="150" align="right">
          <template #default="{ row }">
            <span class="text-success">+ {{ row.bQty || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="aComment" label="摘要/备注" min-width="200" show-overflow-tooltip/>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useTraceStore} from '@/stores/purchase/trace'
import {manualFinishPurchaseApi, type PurchaseTraceVO} from '@/api/purchase/trace'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Check} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const traceStore = useTraceStore()


// 🌟 核心修改：利用 computed 拦截器覆写状态
const summaryData = computed<PurchaseTraceVO | null>(() => {
  if (traceStore.detailList.length > 0) {
    const originalItem = traceStore.detailList[0]
    if (!originalItem) return null

    // ✅ 正确姿势：在这里动态实时读取 URL 参数,避免重用组件导致的显示异常
    const isFromFinished = route.query.isFinished === 'true'

    // 如果是从“已完成采购单”列表进来的
    if (isFromFinished) {
      // 返回一个克隆对象，覆写状态字段。
      // 绝对不要直接修改 originalItem.statusName，那会破坏 Pinia 的单向数据流！
      return {
        ...originalItem,
        statusName: '已完成',
        statusTag: 'success' // 顺便把高亮标签变成绿色，视觉统一
      }
    }

    // 如果是从“其他入库”进来的，原样返回后端真实数据
    return originalItem
  }
  return null
})

onMounted(() => {
  // 1. 从 Vue Router 的 URL 参数中提取 vchcode 和 dlyorder
  const vchcode = Number(route.params.vchcode)
  const dlyorder = Number(route.params.dlyorder)

  if (vchcode && dlyorder) {
    // 2. 触发 Pinia Action，请求后端数据
    traceStore.fetchDetailList({vchcode, dlyorder})
  } else {
    // 防御性编程：如果 URL 参数丢失，退回主列表
    goBack()
  }
})

// 返回上一页
const goBack = () => {
  // router.back() 能够完美保留之前主列表的搜索条件和分页状态
  router.back()
}

// 🌟 进入第三层级：将当前行的数据拍个“快照”存入 Store，并跳往比对页面
/* const goToComparison = (row: PurchaseTraceVO) => {
  traceStore.setCompareItem(row)
  router.push({ path: '/trace/comparison' })
}*/


// 🌟 新增：手动置为完成逻辑
const handleManualFinish = () => {
  if (!summaryData.value) return

  // 弹出输入框要求输入 extInfo
  ElMessageBox.prompt('请输入将其强制置为完成的原因或备注信息（选填）', '手动置为完成', {
    confirmButtonText: '确认执行',
    cancelButtonText: '取消',
    inputPlaceholder: '如：线下已结清 / 供应商折让',
    type: 'warning'
  }).then(async ({value}) => {
    try {
      // 开启加载遮罩 (复用详情的 loading)
      traceStore.isDetailLoading = true

      // 调用 API，如果后端 aVchtype 为空，默认传 34 (采购订单)
      await manualFinishPurchaseApi({
        vchType: 34,
        vchCode: summaryData.value!.aVchcode,
        dlyOrder: summaryData.value!.aDlyOrder,
        extInfo: value || '' // 用户可能没填，传空串
      })

      ElMessage.success('操作成功，订单已置为完成！')

      const sourceKey = route.query.sourceKey as string

      // 在页面发生跳转的前一毫秒，直接从前端内存中干掉这条数据！
      traceStore.removeRecordOptimistically(sourceKey, summaryData.value!.aVchcode, summaryData.value!.aDlyOrder)

      // 🌟 核心：通知列表页刷新数据
      traceStore.needRefreshList = true

      // 成功后退回列表
      setTimeout(()=>goBack(),1000)

    } catch (error) {
      console.error('置为完成失败:', error)
    } finally {
      traceStore.isDetailLoading = false
    }
  }).catch(() => {
    // 用户点击取消，无需处理
  })
}
</script>

<style scoped>
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.header-card {
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-darker);
  padding: 4px 0;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-card, .table-card {
  border-radius: 8px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-darker);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 1px;
}

/* 强调色辅助业务数据展示 */
.highlight-text {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
}

.text-success {
  color: #67c23a;
  font-weight: 600;
}

.text-gray {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

/* 深度美化暗色模式下的 Descriptions 边框 */
:deep(.dark-descriptions .el-descriptions__cell) {
  border-color: #363637;
}

:deep(.dark-descriptions .el-descriptions__label) {
  background-color: #1d1e1f;
  color: var(--el-text-color-regular);
  font-weight: bold;
}

:deep(.el-table th.el-table__cell) {
  background-color: #1d1e1f;
  color: var(--el-text-color-primary);
}
</style>
