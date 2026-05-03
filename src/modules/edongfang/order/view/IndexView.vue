<!-- src/modules/edongfang/order/view/IndexView.vue -->
<template>
  <div class="order-container">
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams" size="default">
        <!-- 🌟 支持逗号分隔搜索 -->
        <el-form-item label="E采订单号">
          <el-input v-model.trim="queryParams.eOrderIds" clearable
                    placeholder="支持输入多个逗号分隔" style="width: 250px"/>
        </el-form-item>
        <!-- 在非发货页面，允许查状态 -->
        <el-form-item v-if="!isShippedPage" label="订单状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态"
                     style="width: 150px">
            <el-option :value="0" label="新建"/>
            <el-option :value="5" label="发货"/>
            <el-option :value="-2" label="取消"/>
            <el-option :value="1" label="签收(妥投)"/>
            <el-option :value="4" label="退换货中"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left-actions">
            <!-- 🌟 操作按钮联动，非选中状态禁用 -->
            <el-button :disabled="!selectionIds.length" icon="CircleClose" type="danger"
                       @click="handleBatchAction('cancel')">取消订单
            </el-button>
            <el-button :disabled="!selectionIds.length" icon="Van" type="primary"
                       @click="handleBatchAction('ship')">订单发货
            </el-button>
            <el-button :disabled="!selectionIds.length" icon="CircleCheck" type="success"
                       @click="handleBatchAction('deliver')">妥投完成
            </el-button>
          </div>
          <div class="right-info">
            <el-tag type="info">已选择 {{ selectionIds.length }} 项</el-tag>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="orderList" border height="calc(100vh - 300px)" stripe
                @selection-change="handleSelectionChange">
        <el-table-column align="center" type="selection" width="50"/>
        <el-table-column label="E采平台订单号" prop="eOrderId" width="200"/>
        <el-table-column label="收货人" prop="name" width="120"/>
        <el-table-column label="采购人" prop="purchaser" width="120"/>
        <el-table-column align="right" label="订单金额" prop="orderPrice" width="120">
          <template #default="{ row }"><span
            style="color: #409EFF; font-weight: bold;">¥ {{ row.orderPrice }}</span></template>
        </el-table-column>
        <el-table-column align="center" label="订单状态" prop="status" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" effect="dark">{{
                getStatusText(row.status)
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="客户确认状态" prop="submitState" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.submitState===1" effect="plain" type="success">已确认</el-tag>
            <el-tag v-else-if="row.submitState===-1" effect="plain" type="danger">已取消</el-tag>
            <el-tag v-else effect="plain" type="info">未确认</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="创建时间" min-width="160" prop="createTime">
          <template #default="{ row }">{{ row.createTime?.replace('T', ' ') }}</template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="120">
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
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {cancelOrdersApi, deliverOrdersApi, pageOrdersApi, shipOrdersApi} from '../api/order'

defineOptions({name: 'EdongfangOrderIndex'})

const route = useRoute()
const router = useRouter()

// 🌟 通过路由 meta 判定是否处于“发货信息页”模式
const isShippedPage = computed(() => !!route.meta.queryShipped)

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const selectionIds = ref<string[]>([])

const queryParams = reactive({
  pageNo: 1,
  pageSize: 50,
  eOrderIds: '',
  status: undefined as number | undefined,
  queryShipped: isShippedPage.value
})

const getStatusText = (s: number) => {
  switch (s) {
    case 0:
      return '新建'
    case 5:
      return '发货'
    case -2:
      return '取消'
    case 1:
      return '签收(妥投)'
    case 4:
      return '退换货中'
    default:
      return '未知'
  }
}
const getStatusTag = (s: number) => {
  switch (s) {
    case 0:
      return 'info'
    case 5:
      return 'primary'
    case 1:
      return 'success'
    case -2:
      return 'danger'
    case 4:
      return 'warning'
    default:
      return 'info'
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageOrdersApi(queryParams)
    orderList.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

// 监听路由参数变化，若在两个菜单间切换，重新加载
watch(() => route.meta.queryShipped, (newVal) => {
  queryParams.queryShipped = !!newVal
  queryParams.status = undefined
  handleQuery()
})

onMounted(() => fetchList())

const handleQuery = () => {
  queryParams.pageNo = 1
  fetchList()
}
const handleReset = () => {
  queryParams.eOrderIds = ''
  queryParams.status = undefined
  handleQuery()
}
const handleSelectionChange = (selection: any[]) => {
  selectionIds.value = selection.map(item => item.eOrderId) // 注意后端传回的驼峰名可能是 eOrderId 或 eOrderId
}

// 🌟 统一的操作分发逻辑
const handleBatchAction = (actionType: 'cancel' | 'deliver' | 'ship') => {
  const map = {
    cancel: {name: '取消订单', api: cancelOrdersApi, type: 'danger'},
    deliver: {name: '妥投完成', api: deliverOrdersApi, type: 'success'},
    ship: {name: '订单发货', api: shipOrdersApi, type: 'primary'}
  }
  const config = map[actionType]

  ElMessageBox.confirm(`确认对选中的 ${selectionIds.value.length} 笔订单执行【${config.name}】操作吗？此状态将被同步至E采平台。`, '高危操作', {
    confirmButtonText: '确定执行',
    cancelButtonText: '取消',
    type: config.type as any
  }).then(async () => {
    await config.api({eOrderIds: selectionIds.value})
    ElMessage.success(`订单已成功${config.name}`)
    fetchList()
  })
}

// 🌟 携带列表页的 isShipped 状态跳转详情
const goDetail = (row: any) => {
  router.push({
    path: `/edongfang/order/detail/${row.eOrderId}`,
    query: {
      isShipped: isShippedPage.value ? 'true' : 'false' // 传递模式参数
    }
  })
}
</script>

<style scoped>
.order-container {
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
