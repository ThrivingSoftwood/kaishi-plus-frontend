<template>
  <div v-loading="loading" class="order-detail-container">
    <!-- ================= 1. 顶部操作栏 ================= -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBack">
        <template #content>
          <span class="header-title">订单详情：{{ eOrderId }}</span>
          <el-tag :type="getStatusTag(orderData.status)" class="ml-4" effect="dark">
            {{ getStatusText(orderData.status) }}
          </el-tag>
          <el-tag v-if="orderData.submitState === 1" class="ml-2" effect="plain" type="success">
            客户已确认
          </el-tag>
          <el-tag v-else-if="orderData.submitState === -1" class="ml-2" effect="plain"
                  type="danger">客户已取消
          </el-tag>
          <el-tag v-else class="ml-2" effect="plain" type="info">客户未确认</el-tag>
        </template>
        <template #extra>
          <div class="actions">
            <!-- 🌟 需求2：在“发货信息”模式下，强行隐藏所有操作按钮 -->
            <template v-if="!isShippedMode">
              <el-button :disabled="orderData.status === -2" plain type="danger"
                         @click="handleAction('cancel')">取消订单
              </el-button>
              <el-button :disabled="orderData.status === 5 || orderData.status === 1" type="primary"
                         @click="handleAction('ship')">订单发货
              </el-button>
              <el-button :disabled="orderData.status === 1" type="success"
                         @click="handleAction('deliver')">妥投完成
              </el-button>
            </template>
            <el-button @click="goBack">返回列表</el-button>
          </div>
        </template>
      </el-page-header>
    </el-card>

    <!-- ================= 2. 订单主信息 (全量字段展示) ================= -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <InfoFilled/>
          </el-icon>
          <span>基础与财务信息</span></div>
      </template>
      <el-descriptions :column="3" border class="dark-desc">
        <el-descriptions-item label="订单金额"><span class="price-text">¥ {{
            orderData.orderPrice
          }}</span></el-descriptions-item>
        <el-descriptions-item label="运费">¥ {{ orderData.freight || 0 }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ orderData.payment === 9 ? '账期支付' : (orderData.payment || '其他') }}
        </el-descriptions-item>
        <el-descriptions-item label="采购人">{{ orderData.purchaser }}</el-descriptions-item>
        <el-descriptions-item label="采购人电话">{{
            orderData.purchaserPhone || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="采购人手机">{{
            orderData.purchaserMobile || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="采购人邮箱">{{
            orderData.purchaserEmail || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item :span="2" label="采购单位名称">{{
            orderData.depName || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item :span="3" label="订单备注"><span
          class="remark-text">{{ orderData.remark || '无' }}</span></el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Location/>
          </el-icon>
          <span>收货及联系信息</span></div>
      </template>
      <el-descriptions :column="3" border class="dark-desc">
        <el-descriptions-item label="收货人">{{ orderData.name }}</el-descriptions-item>
        <el-descriptions-item label="收货座机">{{ orderData.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货手机">{{ orderData.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货邮箱">{{ orderData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮编">{{ orderData.zip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退换货状态">
          <el-tag :type="orderData.refundStatus === 1 ? 'warning' : 'info'" size="small">
            {{
              orderData.refundStatus === 1 ? '退换货中' : (orderData.refundStatus === 2 ? '已完成退换' : '无退换货')
            }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收货区域">{{ orderData.provinceName }} - {{
            orderData.cityName
          }} - {{ orderData.countyName }}
        </el-descriptions-item>
        <el-descriptions-item :span="2" label="详细地址">{{
            orderData.address
          }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Tickets/>
          </el-icon>
          <span>发票信息</span></div>
      </template>
      <el-descriptions :column="3" border class="dark-desc">
        <el-descriptions-item label="发票抬头">{{ orderData.invoiceTitle }}</el-descriptions-item>
        <el-descriptions-item label="发票类型">{{
            orderData.invoiceType === 1 ? '增值税普票' : (orderData.invoiceType === 2 ? '增值税专票' : orderData.invoiceType)
          }}
        </el-descriptions-item>
        <el-descriptions-item label="发票税号">{{
            orderData.invoiceTaxNum || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="发票开户行">{{
            orderData.invoiceBank || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="发票银行账号">{{
            orderData.invoiceBankAccount || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="发票电话">{{
            orderData.invoicePhone || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item :span="3" label="发票地址">{{
            orderData.invoiceAddress || '-'
          }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- ================= 3. 订单商品明细列表 (全量字段展示) ================= -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <List/>
          </el-icon>
          <span>包含商品明细</span></div>
      </template>
      <!-- 字段极多，启用水平滚动 -->
      <el-table :data="items" border stripe style="width: 100%">
        <el-table-column align="center" fixed="left" label="序号" type="index" width="60"/>
        <el-table-column fixed="left" label="商品SKU" prop="sku" show-overflow-tooltip width="130"/>
        <el-table-column fixed="left" label="商品名称" min-width="220" prop="name"
                         show-overflow-tooltip/>

        <el-table-column label="客户物料名称" prop="materialName" show-overflow-tooltip
                         width="160"/>
        <el-table-column label="客户物料编码" prop="materialCode" width="140"/>

        <el-table-column align="center" label="下单数量" prop="num" width="100">
          <template #default="{ row }"><span style="font-weight:bold">{{ row.num }}</span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="含税单价" prop="price" width="120"/>
        <el-table-column align="right" label="未税单价" prop="nakedPrice" width="120"/>
        <el-table-column align="right" label="税率(%)" prop="taxRate" width="100"/>
        <el-table-column align="right" label="单件税额" prop="taxPrice" width="120"/>

        <el-table-column align="right" label="未税总额" prop="nakedPriceTotal" width="130"/>
        <el-table-column align="right" label="总税额" prop="taxPriceTotal" width="130"/>
        <el-table-column align="right" label="含税总价(小计)" prop="priceTotal" width="140">
          <template #default="{ row }"><span class="price-text">¥ {{ row.priceTotal }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="已签收数量" prop="signedCount" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.signedCount" size="small" type="success">{{
                row.signedCount
              }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="已签收金额" prop="signedAmount" width="120"/>

        <el-table-column align="center" label="退换货数量" prop="returnCount" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.returnCount" size="small" type="warning">{{
                row.returnCount
              }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="退货金额" prop="returnAmount" width="120"/>

        <el-table-column label="商品备注" min-width="150" prop="description" show-overflow-tooltip/>

        <el-table-column align="center" fixed="right" label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="goItemDetail(row)">详细项</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {InfoFilled, List, Location, Tickets} from '@element-plus/icons-vue'
import {cancelOrdersApi, deliverOrdersApi, getOrderDetailApi, shipOrdersApi} from '../api/order'

defineOptions({name: 'EdongfangOrderDetail'})

const route = useRoute()
const router = useRouter()
const eOrderId = route.params.eOrderId as string

// 🌟 需求解读核心点：是否来源于发货列表页 (按钮隐身开关)
const isShippedMode = computed(() => route.query.isShipped === 'true')

const loading = ref(false)
const orderData = ref<any>({})
const items = ref<any[]>([])

const getStatusText = (s: number) => {
  switch (s) {
    case 0:
      return '新建订单'
    case 5:
      return '已发货'
    case -2:
      return '已取消'
    case 1:
      return '已签收(妥投)'
    case 4:
      return '退换货中'
    default:
      return '状态未知'
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

onMounted(async () => {
  loading.value = true
  try {
    const res = await getOrderDetailApi(eOrderId)
    orderData.value = res.order || {}
    items.value = res.items || []
  } finally {
    loading.value = false
  }
})

const goBack = () => router.back()

const handleAction = (actionType: 'cancel' | 'deliver' | 'ship') => {
  const map = {
    cancel: {name: '取消订单', api: cancelOrdersApi, type: 'error'},
    deliver: {name: '妥投完成', api: deliverOrdersApi, type: 'success'},
    ship: {name: '订单发货', api: shipOrdersApi, type: 'info'}
  }
  const config = map[actionType]

  ElMessageBox.confirm(`确认对此订单执行【${config.name}】操作吗？操作后状态将同步推送至相关模块。`, '操作确认', {
    type: config.type as any,
    confirmButtonText: '确认执行',
    cancelButtonText: '取消'
  }).then(async () => {
    await config.api({eOrderIds: [eOrderId]})
    ElMessage.success('操作成功')
    goBack() // 🌟 操作完后，直接返回上一级列表刷新状态
  })
}

// 可选：明细详情单页（如果你在系统中注册了这个路由的话）
const goItemDetail = (row: any) => {
  router.push(`/edongfang/order/detail/item-detail/${row.pk}`)
}
</script>

<style scoped>
.order-detail-container {
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
  margin: -20px -20px 0 -20px;
  padding: 0 20px;
  border-radius: 0 0 8px 8px;
  border-bottom: 1px solid var(--el-border-color-darker);
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
  color: var(--el-color-primary);
}

.actions {
  display: flex;
  gap: 12px;
}

:deep(.dark-desc .el-descriptions__label) {
  background-color: var(--el-bg-color-overlay);
  font-weight: 600;
  width: 130px;
  color: var(--el-text-color-regular);
}

.price-text {
  color: #409EFF;
  font-weight: bold;
  font-size: 15px;
}

.remark-text {
  color: var(--el-color-warning);
  font-weight: 500;
}

.ml-4 {
  margin-left: 16px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
