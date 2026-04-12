<!-- src/views/trace/Index.vue -->
<template>
  <div class="trace-container">
    <!-- 🔍 1. 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="currentParams" size="default" @submit.prevent="handleQuery">
        <el-form-item  label="单据号">
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
        <el-table
          v-loading="!!currentLoading"
          :data="currentList"
          border
          stripe
          style="width: 100%"
          height="100%"
        >
          <!-- 基础信息 -->
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="date" label="单据日期" width="110" align="center" />
          <el-table-column prop="number" label="订单号" width="170" show-overflow-tooltip />
          <el-table-column prop="vchCode" label="单据号" width="100" align="center" />
          <el-table-column prop="dlyOrder" label="详单号" width="100" align="center" />

          <!-- 业务往来 -->
          <el-table-column prop="btypeFullname" label="供应商" min-width="180" show-overflow-tooltip />
          <el-table-column prop="etypeFullname" label="经手人" width="90" align="center" />

          <!-- 商品明细 -->
          <el-table-column prop="ptypeFullname" label="商品名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="unitFullname" label="单位" width="70" align="center" />
          <el-table-column prop="blockNo" label="栋号" width="110" align="center" />

          <!-- 财务/数量统计 -->
          <el-table-column label="数量与金额统计" align="center">
            <el-table-column prop="buyQty" label="采购量" width="90" align="right" />
            <el-table-column prop="price" label="单价" width="100" align="right">
              <template #default="{ row }">
                {{ row.price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="discountTotal" label="总金额" width="110" align="right">
              <template #default="{ row }">
               <span style="font-weight: bold; color: var(--el-color-primary);">
                 {{ row.discountTotal?.toFixed(2) }}
               </span>
              </template>
            </el-table-column>
            <el-table-column prop="stockedQty" label="已入库" width="90" align="right">
              <template #default="{ row }">
                <span class="text-success">{{ row.stockedQty }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="owedQty" label="欠交" width="90" align="right">
              <template #default="{ row }">
                <span :class="row.owedQty > 0 ? 'text-danger' : 'text-gray'">{{ row.owedQty }}</span>
              </template>
            </el-table-column>
          </el-table-column>

          <!-- 状态与标记 -->
          <el-table-column prop="statusName" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.statusTag" effect="dark" size="small">{{ row.statusName }}</el-tag>
              <!-- 如果是红冲单据，额外显示一个标记 -->
              <el-tag v-if="row.redWord === '是'" type="danger" effect="plain" size="small" style="margin-top: 4px">红冲</el-tag>
            </template>
          </el-table-column>

          <!-- 辅助信息 -->
          <el-table-column prop="summary" label="单据摘要" min-width="200" show-overflow-tooltip />
          <el-table-column prop="comment" label="备注" min-width="150" show-overflow-tooltip />

          <!-- 操作列 -->
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link icon="View" @click="goToDetail(row)">
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- ... 分页部分保持不变 ... -->
      <!-- 📝 3. 分页控制区 (带有自定义 PageSize 输入框) -->
      <div class="pagination-wrapper">

        <!-- 🌟 自定义：每页条数输入框 -->
        <div class="custom-page-size">
          <span class="label">每页显示：</span>
          <el-input-number
            v-model="currentParams!.pageSize"
            :min="1"
            :max="1000"
            :step="10"
            size="small"
            controls-position="right"
            @change="handleQuery"
          />
          <span class="unit">条</span>
        </div>

        <!-- 🌟 原生分页器：注意 layout 中移除了 'sizes' -->
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
import { ref, onMounted,onActivated } from 'vue'
import {routerKey, useRoute, useRouter} from 'vue-router'
import { useTraceStore } from '@/stores/trace/purchase'
import type {DlyBuyVO} from "@/api/trace/purchase.ts";

// 给组件命名 (可选，但推荐在使用 KeepAlive 时加上)
defineOptions({ name: 'PurchaseIndexView' })

const route = useRoute()
const router = useRouter()
const traceStore = useTraceStore()


// 🌟 核心标识：获取当前路由的名称 (如 TraceFinishedPurchase)，作为状态隔离的唯一 Key
const routeKey = (route.name as string) || route.path

// 2. ★ 关键修复：在 Setup 顶层立即执行初始化，而不是放在 onMounted 里
// 这样在模板渲染第一行代码前，Map 里的 Key 已经存在了
traceStore.initModuleState(routeKey, !!route.meta.queryPurchased)

// 3. 建立一个计算属性代理，简化模板访问，并提供类型安全
const currentParams = computed(() => traceStore.queryParamsMap[routeKey])
const currentList = computed(() => traceStore.listInfoMap[routeKey] || [])
const currentLoading = computed(() => traceStore.isLoadingMap[routeKey] || false)
const currentTotal = computed(() => traceStore.totalMap[routeKey] || 0)

// 日期范围独立管理，查询时再同步给 store
const dateRange = ref<[string, string] | null>(null)

// 4. 初始化数据请求
onMounted(() => {
  // 恢复日期显示逻辑
  if (currentParams?.value?.minDate && currentParams.value.maxDate) {
    dateRange.value = [currentParams.value.minDate, currentParams.value.maxDate]
  }
  handleQuery()
})

// 🌟 因为包裹了 KeepAlive，当切换回这个 Tab 时，onMounted 不会执行，触发的是 onActivated
onActivated(() => {
  // 从 Store 恢复日历组件的值
  const currentParams = traceStore.queryParamsMap[routeKey]
  if (currentParams && currentParams.minDate && currentParams.maxDate) {
    dateRange.value = [currentParams.minDate, currentParams.maxDate]
  }
})

// 5. 触发查询
// 修改 handleQuery 等方法，直接使用 currentParams.value
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

// 触发重置
const handleReset = () => {
  dateRange.value = null
  traceStore.resetQuery(routeKey)
  handleQuery()
}

// 🌟 核心二：进入第二层级 (详情列表)
const goToDetail = (row: DlyBuyVO) => {
  // 使用编程式路由导航。由于之前商定要支持多层级穿透，我们需要将唯一键传过去
  // 我们需要在 router 中配置动态路由：/trace/detail/:vchcode/:dlyorder
  router.push({
    path: `/trace/purchase/detail/${row.vchCode}/${row.dlyOrder}`,
    // 🌟 新增 query 参数：如果是从已完成列表进来的，传入 isFinished=true
    query: {
      isFinished: route.meta.queryPurchased ? 'true' : 'false',
      sourceKey: route.name as string || route.path
    }
  })
}
</script>

<style scoped>
.trace-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 🌟 强制父容器撑满内容区 */
  overflow: hidden; /* 🌟 禁止父容器出现滚动条 */
}

.filter-card {
  flex-shrink: 0; /* 🌟 搜索栏不压缩 */
  margin-bottom: 16px;
}

.table-card {
  flex: 1; /* 🌟 核心：表格卡片占据剩余所有高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 🌟 禁止卡片溢出 */
}

/* 覆盖 Element Plus 卡片内部 body 的样式 */
:deep(.table-card .el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 15px; /* 保持间距 */
}

.table-wrapper {
  flex: 1; /* 🌟 关键：让包裹层占据 Card body 的剩余空间 */
  overflow: hidden;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  align-items: center; /* 确保垂直居中对齐 */
  gap: 20px; /* 让输入框和分页器之间留出呼吸空间 */
}

/* 自定义分页输入框样式 */
.custom-page-size {
  display: flex;
  align-items: center;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.custom-page-size .label {
  margin-right: 8px;
}

.custom-page-size .unit {
  margin-left: 8px;
}

/* 覆盖 el-input-number 在暗黑模式下的细微瑕疵 */
:deep(.custom-page-size .el-input-number) {
  width: 100px;
}

/* 强调色辅助业务数据展示 */
.text-success {
  color: #67c23a;
  font-weight: 600;
}
.text-danger {
  color: #f56c6c;
  font-weight: 600;
}
.text-gray {
  color: var(--el-text-color-placeholder);
}

/* 深度覆盖 Element Plus 的默认表头样式，使其更配暗黑主题 */
:deep(.el-table th.el-table__cell) {
  background-color: #1d1e1f;
  color: var(--el-text-color-primary);
}
</style>
