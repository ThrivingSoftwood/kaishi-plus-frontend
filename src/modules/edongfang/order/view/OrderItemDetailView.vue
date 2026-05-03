<template>
  <div v-loading="loading" class="item-detail-container">
    <!-- ================= 1. 顶部操作栏 ================= -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBack">
        <template #content>
          <span class="header-title">商品明细项详情</span>
          <el-tag class="ml-4" type="info">归属订单: {{
              itemData.eorderId || itemData.eOrderId
            }}
          </el-tag>
        </template>
        <template #extra>
          <el-button @click="goBack">返回上一页</el-button>
        </template>
      </el-page-header>
    </el-card>

    <!-- ================= 2. 基础商品档案 ================= -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Box/>
          </el-icon>
          <span>基础商品档案</span></div>
      </template>
      <el-descriptions :column="2" border class="dark-desc">
        <el-descriptions-item label="商品SKU">{{ itemData.sku }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ itemData.name }}</el-descriptions-item>
        <el-descriptions-item label="客户物料名称">{{
            itemData.materialName || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item label="客户物料编码">{{
            itemData.materialCode || '-'
          }}
        </el-descriptions-item>
        <el-descriptions-item :span="2" label="商品备注">
          <span class="remark-text">{{ itemData.description || '无备注信息' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- ================= 3. 价税财务明细 ================= -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Money/>
          </el-icon>
          <span>价税财务明细</span></div>
      </template>
      <el-descriptions :column="3" border class="dark-desc">
        <el-descriptions-item label="下单数量">
          <span class="highlight-num">{{ itemData.num }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="税率 (%)">
          {{ itemData.taxRate ? itemData.taxRate + '%' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="单件税额">
          ¥ {{ itemData.taxPrice || 0 }}
        </el-descriptions-item>

        <el-descriptions-item label="未税单价">
          ¥ {{ itemData.nakedPrice || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="含税单价">
          ¥ {{ itemData.price || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="商品税额合计">
          ¥ {{ itemData.taxPriceTotal || 0 }}
        </el-descriptions-item>

        <el-descriptions-item label="未税总额 (小计)">
          ¥ {{ itemData.nakedPriceTotal || 0 }}
        </el-descriptions-item>
        <el-descriptions-item :span="2" label="含税总额 (小计)">
          <span class="price-text">¥ {{ itemData.priceTotal || 0 }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- ================= 4. 履约状态明细 ================= -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon>
            <Van/>
          </el-icon>
          <span>订单履约状态</span></div>
      </template>
      <el-descriptions :column="2" border class="dark-desc">
        <el-descriptions-item label="已签收数量">
          <el-tag v-if="itemData.signedCount" effect="dark" type="success">{{
              itemData.signedCount
            }}
          </el-tag>
          <span v-else class="empty-text">尚未签收</span>
        </el-descriptions-item>
        <el-descriptions-item label="已签收金额">
          <span v-if="itemData.signedAmount" class="success-text">¥ {{
              itemData.signedAmount
            }}</span>
          <span v-else class="empty-text">-</span>
        </el-descriptions-item>

        <el-descriptions-item label="退换货数量">
          <el-tag v-if="itemData.returnCount" effect="dark" type="warning">{{
              itemData.returnCount
            }}
          </el-tag>
          <span v-else class="empty-text">无退换货</span>
        </el-descriptions-item>
        <el-descriptions-item label="退换货金额">
          <span v-if="itemData.returnAmount" class="warning-text">¥ {{
              itemData.returnAmount
            }}</span>
          <span v-else class="empty-text">-</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {Box, Money, Van} from '@element-plus/icons-vue'
// 引入对应的接口
import {getOrderItemApi} from '../api/order'

defineOptions({name: 'EdongfangOrderItemDetail'})

const route = useRoute()
const router = useRouter()
// 这里的 pk 对应路由里的 :pk
const pk = route.params.pk as string

const loading = ref(false)
const itemData = ref<any>({})

onMounted(async () => {
  if (pk) {
    await fetchItemDetail()
  }
})

const fetchItemDetail = async () => {
  loading.value = true
  try {
    const res = await getOrderItemApi(pk)
    // 根据后端的返回格式赋值
    itemData.value = res || {}
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.item-detail-container {
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
  font-size: 16px;
}

:deep(.dark-desc .el-descriptions__label) {
  background-color: var(--el-bg-color-overlay);
  font-weight: 600;
  width: 140px;
  color: var(--el-text-color-regular);
}

.ml-4 {
  margin-left: 16px;
}

/* 文本与数值高亮样式 */
.highlight-num {
  font-weight: bold;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.price-text {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}

.success-text {
  color: #67C23A;
  font-weight: bold;
}

.warning-text {
  color: #E6A23C;
  font-weight: bold;
}

.remark-text {
  color: var(--el-text-color-regular);
  font-style: italic;
}

.empty-text {
  color: var(--el-text-color-placeholder);
}
</style>
