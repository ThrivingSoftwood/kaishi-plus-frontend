<template>
  <div class="logistics-container">
    <!-- 🔍 搜索区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams" size="default">
        <el-form-item label="E采订单号">
          <el-input v-model.trim="queryParams.eOrderId" clearable placeholder="请输入订单号"
                    @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="物流运单号">
          <el-input v-model.trim="queryParams.expressNo" clearable placeholder="请输入物流号"
                    @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item>
          <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 📊 列表区 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left-actions">
            <!-- 🌟 补充的新增功能入口 -->
            <el-button icon="Plus" type="primary" @click="handleAdd">新增</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="list" border height="calc(100vh - 250px)" stripe>
        <el-table-column align="center" label="序号" type="index" width="60"/>
        <el-table-column label="E采订单号" prop="eorderId" width="180">
          <template #default="{ row }">{{ row.eorderId || row.eOrderId }}</template>
        </el-table-column>
        <el-table-column label="物流公司" prop="expressCompany" width="150"/>
        <el-table-column label="物流单号" min-width="180" prop="expressNo"/>
        <el-table-column align="right" label="订单金额" prop="orderPrice" width="120">
          <template #default="{ row }">¥ {{ row.orderPrice || 0 }}</template>
        </el-table-column>
        <el-table-column align="center" label="物流状态" prop="logisticsState" width="120">
          <template #default="{ row }">
            <el-tag :type="getStateTag(row.logisticsState)" effect="dark">
              {{ getStateText(row.logisticsState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="签收时间" prop="receiveTime" width="170">
          <template #default="{ row }">{{ row.receiveTime?.replace('T', ' ') || '-' }}</template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="100">
          <template #default="{ row }">
            <el-button icon="View" link type="primary" @click="goDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {pageLogisticsApi} from '../api/logistics'

defineOptions({name: 'EdongfangLogisticsIndex'})

const router = useRouter()
const loading = ref(false)
const list = ref([])
const total = ref(0)

const queryParams = reactive({pageNo: 1, pageSize: 20, eOrderId: '', expressNo: ''})

const getStateText = (state: number) => {
  const map: Record<number, string> = {
    0: '新建',
    '-1': '拒收',
    '-2': '已取消',
    1: '妥投完成',
    4: '退换货中',
    5: '已出库'
  }
  return map[state] || '未知'
}
const getStateTag = (state: number) => {
  const map: Record<number, string> = {
    0: 'info',
    '-1': 'danger',
    '-2': 'info',
    1: 'success',
    4: 'warning',
    5: 'primary'
  }
  return map[state] || 'info'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageLogisticsApi(queryParams)
    list.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchList())

const handleQuery = () => {
  queryParams.pageNo = 1;
  fetchList()
}
const handleReset = () => {
  queryParams.eOrderId = '';
  queryParams.expressNo = '';
  handleQuery()
}

// 🌟 路由跳转
const handleAdd = () => router.push('/edongfang/logistics/detail/new')
const goDetail = (row: any) => router.push(`/edongfang/logistics/detail/view/${row.pk}`)
</script>

<style scoped>
.logistics-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.filter-card {
  flex-shrink: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.table-card .el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
