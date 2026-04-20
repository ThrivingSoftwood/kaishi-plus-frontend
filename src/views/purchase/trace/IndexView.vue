<!-- src/views/purchase/trace/IndexView.vue -->
<template>
  <div class="trace-container">
    <!-- 🔍 1. 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="currentParams" size="default" @submit.prevent="handleQuery">
        <el-form-item label="单据号">
          <el-input v-model.number="currentParams!.vchcode" placeholder="精准查询单据号" clearable />
        </el-form-item>
        <el-form-item label="详单号">
          <el-input v-model.number="currentParams!.dlyorder" placeholder="精准查询详单号" clearable />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model.trim="currentParams!.number" placeholder="模糊搜索订单号" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 📊 2. 数据表格区 -->
    <el-card class="table-card" shadow="never">
      <div class="table-wrapper">
        <el-table v-loading="!!currentLoading" :data="currentList" border stripe style="width: 100%" height="100%">
          <!-- 2.1 固定列：序号 -->
          <el-table-column type="index" label="序号" width="60" align="center" />

          <!-- 2.2 配置驱动：基础信息列 -->
          <template v-for="col in baseColumns" :key="col.prop">
            <el-table-column
              v-if="!col.perm || authStore.hasPermission(col.perm)"
              :prop="col.prop"
              :label="col.label"
              :width="col.width"
              :min-width="col.minWidth"
              :align="col.align || 'left'"
              :show-overflow-tooltip="col.tooltip"
            />
          </template>

          <!-- 2.3 配置驱动：统计组 (多级表头) -->
          <el-table-column label="数量与金额统计" align="center">
            <template v-for="sub in statsColumns" :key="sub.prop">
              <el-table-column
                v-if="!sub.perm || authStore.hasPermission(sub.perm)"
                :prop="sub.prop"
                :label="sub.label"
                :width="sub.width"
                align="right"
              >
                <template #default="{ row }">
                  <span v-if="sub.type === 'money'" :style="sub.style">
                    {{ row[sub.prop]?.toFixed(2) }}
                  </span>
                  <span v-else-if="sub.prop === 'stockedQty'" class="text-success">{{ row.stockedQty }}</span>
                  <span v-else-if="sub.prop === 'owedQty'" :class="row.owedQty > 0 ? 'text-danger' : 'text-gray'">
                    {{ row.owedQty }}
                  </span>
                  <span v-else>{{ row[sub.prop] }}</span>
                </template>
              </el-table-column>
            </template>
          </el-table-column>

          <!-- 2.4 状态列 (特殊逻辑，不走配置) -->
          <el-table-column prop="statusName" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.statusTag" effect="dark" size="small">{{ row.statusName }}</el-tag>
              <el-tag v-if="row.redWord === '是'" type="danger" effect="plain" size="small" style="margin-top: 4px">红冲</el-tag>
            </template>
          </el-table-column>

          <!-- 2.5 辅助信息 (不走配置) -->
          <el-table-column prop="summary" label="单据摘要" min-width="200" show-overflow-tooltip />
          <el-table-column prop="comment" label="备注" min-width="150" show-overflow-tooltip />

          <!-- 2.6 操作列 -->
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link icon="View" @click="goToDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 📝 3. 分页控制区 -->
      <div class="pagination-wrapper">
        <div class="custom-page-size">
          <span class="label">每页显示：</span>
          <el-input-number v-model="currentParams!.pageSize" :min="1" :max="1000" :step="10" size="small" controls-position="right" @change="handleQuery" />
          <span class="unit">条</span>
        </div>
        <el-pagination
          v-model:current-page="currentParams!.pageNo"
          v-model:page-size="currentParams!.pageSize"
          layout="total, prev, pager, next, jumper"
          :total="currentTotal"
          @current-change="handleQuery"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTraceStore } from '@/stores/purchase/trace'
import { useAuthStore } from '@/stores/auth'
import type { DlyBuyVO } from "@/api/purchase/trace"

defineOptions({ name: 'PurchaseIndexView' })

const route = useRoute()
const router = useRouter()
const traceStore = useTraceStore()
const authStore = useAuthStore()

// 🌟 配置驱动定义：列配置
const baseColumns = [
  { prop: 'date', label: '单据日期', width: '110', align: 'center' },
  { prop: 'number', label: '订单号', width: '170', tooltip: true },
  { prop: 'vchCode', label: '单据号', width: '100', align: 'center' },
  { prop: 'dlyOrder', label: '详单号', width: '100', align: 'center' },
  { prop: 'btypeFullname', label: '供应商', minWidth: '180', tooltip: true, perm: 'purchase:btype:view'  },
  { prop: 'etypeFullname', label: '经手人', width: '90', align: 'center' },
  { prop: 'ptypeFullname', label: '商品名称', minWidth: '220', tooltip: true },
  { prop: 'unitFullname', label: '单位', width: '70', align: 'center' },
  { prop: 'blockNo', label: '栋号', width: '110', align: 'center' },
]

const statsColumns = [
  { prop: 'buyQty', label: '采购量', width: '90' },
  // 🌟 带有权限受控的列
  { prop: 'price', label: '单价', width: '100', type: 'money', perm: 'purchase:price:view' },
  { prop: 'discountTotal', label: '总金额', width: '110', type: 'money', perm: 'purchase:price:view', style: 'font-weight: bold; color: var(--el-color-primary);' },
  { prop: 'stockedQty', label: '已入库', width: '90' },
  { prop: 'owedQty', label: '欠交', width: '90' },
]

// 逻辑层：路由与状态隔离
const routeKey = (route.name as string) || route.path
traceStore.initModuleState(routeKey, !!route.meta.queryPurchased)

const currentParams = computed(() => traceStore.queryParamsMap[routeKey])
const currentList = computed(() => traceStore.listInfoMap[routeKey] || [])
const currentLoading = computed(() => traceStore.isLoadingMap[routeKey] || false)
const currentTotal = computed(() => traceStore.totalMap[routeKey] || 0)

const dateRange = ref<[string, string] | null>(null)

const handleQuery = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    currentParams.value!.minDate = dateRange.value[0]
    currentParams.value!.maxDate = dateRange.value[1]
  } else {
    currentParams.value!.minDate = ''
    currentParams.value!.maxDate = ''
  }
  traceStore.fetchListInfo(routeKey)
}

const handleReset = () => {
  dateRange.value = null
  traceStore.resetQuery(routeKey)
  handleQuery()
}

const goToDetail = (row: DlyBuyVO) => {
  router.push({
    path: `/purchase/trace/detail/${row.vchCode}/${row.dlyOrder}`,
    query: {
      isFinished: route.meta.queryPurchased ? 'true' : 'false',
      sourceKey: route.name as string || route.path
    }
  })
}

onMounted(() => {
  if (currentParams?.value?.minDate && currentParams.value.maxDate) {
    dateRange.value = [currentParams.value.minDate, currentParams.value.maxDate]
  }
  handleQuery()
})

onActivated(() => {
  const currentParams = traceStore.queryParamsMap[routeKey]
  if (currentParams && currentParams.minDate && currentParams.maxDate) {
    dateRange.value = [currentParams.minDate, currentParams.maxDate]
  }
})
</script>

<style scoped>
.trace-container { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.filter-card { flex-shrink: 0; margin-bottom: 16px; }
.table-card { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
:deep(.table-card .el-card__body) { flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 15px; }
.table-wrapper { flex: 1; overflow: hidden; }
.pagination-wrapper { margin-top: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 20px; }
.custom-page-size { display: flex; align-items: center; color: var(--el-text-color-regular); font-size: 14px; }
.custom-page-size .label { margin-right: 8px; }
.custom-page-size .unit { margin-left: 8px; }
:deep(.custom-page-size .el-input-number) { width: 100px; }
.text-success { color: #67c23a; font-weight: 600; }
.text-danger { color: #f56c6c; font-weight: 600; }
.text-gray { color: var(--el-text-color-placeholder); }
:deep(.el-table th.el-table__cell) { background-color: #1d1e1f; color: var(--el-text-color-primary); }
</style>
