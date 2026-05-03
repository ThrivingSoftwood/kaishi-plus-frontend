<template>
  <div class="product-container">
    <!-- 🔍 1. 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="queryParams" size="default">
        <el-form-item label="商品SKU">
          <el-input v-model.trim="queryParams.sku" clearable placeholder="精准查询SKU"
                    @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model.trim="queryParams.name" clearable placeholder="模糊搜索商品名称"
                    @keyup.enter="handleQuery"/>
        </el-form-item>
        <el-form-item>
          <el-button icon="Search" type="primary" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 📊 2. 数据工具栏与表格区 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="left-actions">
            <el-button icon="Plus" type="primary" @click="handleAdd">新增商品</el-button>
            <el-button
              :disabled="!selectionSkus.length"
              icon="Top"
              type="success"
              @click="handleBatchStatus(1)"
            >批量上架
            </el-button>
            <el-button
              :disabled="!selectionSkus.length"
              icon="Bottom"
              type="danger"
              @click="handleBatchStatus(0)"
            >批量下架
            </el-button>
          </div>
          <div class="right-info">
            <el-tag type="info">已选择 {{ selectionSkus.length }} 项</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="productList"
        border
        height="calc(100vh - 300px)"
        stripe
        @selection-change="handleSelectionChange"
      >
        <!-- 复选框 -->
        <el-table-column align="center" type="selection" width="50"/>

        <!-- 商品主图 -->
        <el-table-column align="center" label="主图" width="100">
          <template #default="{ row }">
            <el-image
              :preview-src-list="[row.imagePath]"
              :src="row.imagePath"
              fit="cover"
              preview-teleported
              style="width: 60px; height: 60px; border-radius: 4px;"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon>
                    <Picture/>
                  </el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column label="商品SKU" prop="sku" show-overflow-tooltip width="160"/>
        <el-table-column label="商品名称" min-width="250" prop="name" show-overflow-tooltip/>
        <el-table-column label="品牌" prop="brandName" width="120"/>
        <el-table-column label="分类" prop="categoryName" width="120"/>

        <!-- 状态列 -->
        <el-table-column align="center" label="状态" prop="state" width="100">
          <template #default="{ row }">
            <el-tag :type="row.state === 1 ? 'success' : 'danger'" effect="dark">
              {{ row.state === 1 ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="创建时间" prop="createTime" width="180">
          <template #default="{ row }">
            {{ row.createTime?.replace('T', ' ') }}
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column align="center" fixed="right" label="操作" width="200">
          <template #default="{ row }">
            <el-button icon="View" link type="primary" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.state === 0"
              icon="Top"
              link
              type="success"
              @click="handleSingleStatus(row, 1)"
            >上架
            </el-button>
            <el-button
              v-else
              icon="Bottom"
              link
              type="danger"
              @click="handleSingleStatus(row, 0)"
            >下架
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 📝 3. 分页控制区 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Picture} from '@element-plus/icons-vue'
import {changeProductStatusApi, pageProductsApi} from "@/modules/edongfang/product/api/product.ts";

// 组件配置
defineOptions({name: 'ProductIndexView'})

const router = useRouter()
const loading = ref(false)
const productList = ref([])
const total = ref(0)
const selectionSkus = ref<string[]>([])

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 50,
  sku: '',
  name: ''
})

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const res = await pageProductsApi(queryParams)
    productList.value = res.records || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchList())

// ===================== 交互逻辑 =====================

const handleQuery = () => {
  queryParams.pageNo = 1
  fetchList()
}

const handleReset = () => {
  queryParams.sku = ''
  queryParams.name = ''
  handleQuery()
}

const handleSelectionChange = (selection: any[]) => {
  selectionSkus.value = selection.map(item => item.sku)
}

// 批量上下架逻辑
const handleBatchStatus = (state: number) => {
  const actionText = state === 1 ? '上架' : '下架'
  ElMessageBox.confirm(`确定要将选中的 ${selectionSkus.value.length} 个商品批量${actionText}吗？操作将同步至E采平台。`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: state === 1 ? 'success' : 'warning'
  }).then(async () => {
    await changeProductStatusApi(state, selectionSkus.value)
    ElMessage.success(`${actionText}成功`)
    fetchList()
  })
}

// 单个上下架
const handleSingleStatus = (row: any, state: number) => {
  const actionText = state === 1 ? '上架' : '下架'
  ElMessageBox.confirm(`确定要${actionText}商品【${row.name}】吗？`, '提示', {
    type: state === 1 ? 'success' : 'warning'
  }).then(async () => {
    await changeProductStatusApi(state, [row.sku])
    ElMessage.success(`${actionText}成功`)
    fetchList()
  })
}

// 路由跳转
const handleAdd = () => router.push('/edongfang/product/detail/new')
const handleEdit = (row: any) => router.push(`/edongfang/product/detail/edit/${row.sku}`)
const handleView = (row: any) => router.push(`/edongfang/product/detail/view/${row.sku}`)

const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  fetchList()
}
const handleCurrentChange = (val: number) => {
  queryParams.pageNo = val
  fetchList()
}
</script>

<style scoped>
.product-container {
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

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 24px;
}
</style>
