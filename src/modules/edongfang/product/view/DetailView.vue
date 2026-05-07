<template>
  <div class="product-detail-container" v-loading="loading">
    <!-- ================= 1. 顶部操作栏 ================= -->
    <el-card class="header-card" shadow="never">
      <el-page-header @back="goBackList">
        <template #content>
          <span class="header-title">{{ pageTitle }}</span>
          <el-tag v-if="formData.product.state !== undefined"
                  :type="formData.product.state === 1 ? 'success' : 'danger'" class="ml-4">
            {{ formData.product.state === 1 ? '已上架' : '已下架' }}
          </el-tag>
        </template>
        <template #extra>
          <div class="actions">
            <el-button @click="goBackList">返回列表</el-button>

            <!-- 🌟 只读模式下：显示进入编辑 -->
            <el-button v-if="!isEditing" type="warning" icon="Edit" v-hasPerm="'product:edit'"
                       @click="startEdit">进入编辑
            </el-button>

            <!-- 🌟 编辑模式下：显示取消和保存 -->
            <template v-else>
              <el-button @click="cancelEdit">取消编辑</el-button>
              <el-button type="primary" :loading="submitting" @click="handleSave">保存商品数据
              </el-button>
            </template>
          </div>
        </template>
      </el-page-header>
    </el-card>

    <!-- 🌟 全局控制表单禁用状态：由 isEditing 决定 -->
    <el-form ref="formRef" :model="formData" :rules="rules" :disabled="!isEditing"
             label-width="130px" label-position="top">

      <!-- ================= 2. 基础核心信息 ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled/></el-icon>
            <span>基础核心信息</span></div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="商品SKU (唯一)" prop="product.sku">
              <!-- SKU 仅在新增时可填，一旦创建禁止修改 -->
              <el-input v-model="formData.product.sku" placeholder="系统内唯一编码"
                        :disabled="mode !== 'new'"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品名称" prop="product.name">
              <el-input v-model="formData.product.name" placeholder="请输入商品全称"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="品牌名称" prop="product.brandName">
              <el-input v-model="formData.product.brandName" placeholder="如：华为"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="分类编码" prop="product.category">
              <el-input v-model="formData.product.category" placeholder="后台分类编码"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类名称" prop="product.categoryName">
              <el-input v-model="formData.product.categoryName" placeholder="如：数码/手机"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="计量单位" prop="product.unit">
              <el-input v-model="formData.product.unit" placeholder="如：个/台/件"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="重量 (kg)" prop="product.weight">
              <el-input-number v-model="formData.product.weight" :precision="2" :step="0.1" :min="0"
                               controls-position="right" style="width: 100%"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ================= 3. 扩展属性配置 ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Operation/></el-icon>
            <span>扩展属性配置</span></div>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="型号" prop="product.model">
              <el-input v-model="formData.product.model" placeholder="请输入商品型号"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="条形码 (UPC)" prop="product.upc">
              <el-input v-model="formData.product.upc" placeholder="请输入条形码"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="产地" prop="product.productArea">
              <el-input v-model="formData.product.productArea" placeholder="请输入商品产地"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="是否促销" prop="product.saleActives">
              <el-switch v-model="formData.product.saleActives" :active-value="1"
                         :inactive-value="0" active-text="是" inactive-text="否"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="税收分类编码" prop="product.taxCategoryCode">
              <el-input v-model="formData.product.taxCategoryCode" placeholder="输入税收编码"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="商品基础税率 (%)" prop="product.taxRate">
              <el-input-number v-model="formData.product.taxRate" :precision="2" :min="0" :max="100"
                               controls-position="right" style="width: 100%"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检索关键词" prop="product.searchKeyword">
              <el-input v-model="formData.product.searchKeyword"
                        placeholder="逗号分隔，用于系统搜索"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="外部商品链接 (URL)" prop="product.url">
              <el-input v-model="formData.product.url" placeholder="如存在外部关联链接可填写"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="包装清单 (Ware)" prop="product.ware">
              <el-input v-model="formData.product.ware" placeholder="如：主机x1, 充电器x1"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="售后服务说明" prop="product.service">
              <el-input v-model="formData.product.service" type="textarea" :rows="2"
                        placeholder="请输入售后服务条款"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ================= 4. 图文详情与主图 ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><Picture/></el-icon>
            <span>图文详情与主图</span></div>
        </template>
        <el-row :gutter="40">
          <el-col :span="24">
            <!-- 改为主图文本输入框 -->
            <el-form-item label="商品主图链接 (单图)" prop="product.imagePath">
              <el-input v-model="formData.product.imagePath" :disabled="!isEditing" placeholder="请输入主图URL地址"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="商品图文详情 (Introduction)">
              <el-input v-model="formData.product.introduction" type="textarea" :rows="5"
                        placeholder="请输入详细描述 (支持HTML代码)"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品参数详情 (Param, HTML版)">
              <el-input v-model="formData.product.param" type="textarea" :rows="5"
                        placeholder="请输入参数富文本详情 (支持HTML代码)"/>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- ================= 5. 商品轮播图集 (Images 子表) ================= -->
      <!-- 🌟 将以前的 FileUpload 改为标准的动态子表 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div><el-icon><Picture/></el-icon><span>商品轮播图集表 (按顺序排列)</span></div>
            <el-button v-if="isEditing" type="primary" link icon="Plus"
                       @click="addImageRow">添加轮播图
            </el-button>
          </div>
        </template>

        <!-- 🌟 关键点：增加 class="image-table" 方便定位样式 -->
        <el-table :data="visibleImages" border stripe class="image-table">
          <el-table-column label="展示顺序" width="100" align="center">
            <template #default="{ row }">
              <b style="color: var(--el-color-primary)"># {{ row.order }}</b>
            </template>
          </el-table-column>

          <el-table-column label="图片网址 (URL)" min-width="300">
            <template #default="{ row }">
              <el-input v-model="row.path" :disabled="!isEditing" @change="markUpdate(row)"
                        placeholder="请输入图片URL"/>
            </template>
          </el-table-column>

          <!-- 🌟 细节：增加排序操作 -->
          <el-table-column v-if="isEditing" label="排序调整" width="120" align="center">
            <template #default="{ $index }">
              <el-button-group>
                <el-button :disabled="$index === 0" icon="ArrowUp" size="small"
                           @click="moveRow($index, -1)" />
                <el-button :disabled="$index === visibleImages.length - 1" icon="ArrowDown" size="small"
                           @click="moveRow($index, 1)" />
              </el-button-group>
            </template>
          </el-table-column>

          <el-table-column v-if="isEditing" label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" icon="Delete" circle size="small"
                         @click="removeRow(formData.images, row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- ================= 6. 商品规格属性 (Params 子表) ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <el-icon><List/></el-icon>
              <span>商品规格属性表</span></div>
            <el-button v-if="isEditing" type="primary" link icon="Plus"
                       @click="addRow(formData.params, {name: '', value: ''})">添加属性项
            </el-button>
          </div>
        </template>
        <el-table :data="visibleParams" border stripe>
          <el-table-column label="属性名称" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.name" :disabled="!isEditing" @change="markUpdate(row)"
                        placeholder="请输入属性名"/>
            </template>
          </el-table-column>
          <el-table-column label="属性值" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.value" :disabled="!isEditing" @change="markUpdate(row)"
                        placeholder="请输入属性值"/>
            </template>
          </el-table-column>
          <el-table-column v-if="isEditing" label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" icon="Delete" circle size="small"
                         @click="removeRow(formData.params, row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- ================= 7. 价格策略 (Prices 子表) ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <el-icon><Money/></el-icon>
              <span>价格梯度配置</span></div>
            <el-button v-if="isEditing" type="primary" link icon="Plus"
                       @click="addRow(formData.prices, {mallPrice: 0, price: 0, taxRate: 0, marketPrice: 0, nakedPrice: 0, taxAmount: 0})">
              添加价格配置
            </el-button>
          </div>
        </template>
        <el-table :data="visiblePrices" border stripe>
          <el-table-column label="市场价" min-width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.marketPrice" :disabled="!isEditing"
                               @change="markUpdate(row)" :precision="2" :step="1"
                               controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="商城售价" min-width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.mallPrice" :disabled="!isEditing"
                               @change="markUpdate(row)" :precision="2" :step="1"
                               controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="协议优惠价" min-width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :disabled="!isEditing" @change="markUpdate(row)"
                               :precision="2" :step="1" controls-position="right"
                               style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="裸价 (未税)" min-width="130">
            <template #default="{ row }">
              <el-input-number v-model="row.nakedPrice" :disabled="!isEditing"
                               @change="markUpdate(row)" :precision="2" :step="1"
                               controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="发票税额" min-width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.taxAmount" :disabled="!isEditing"
                               @change="markUpdate(row)" :precision="2" :step="0.1"
                               controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="税率 (%)" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.taxRate" :disabled="!isEditing"
                               @change="markUpdate(row)" :min="0" :max="100"
                               controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column v-if="isEditing" label="操作" width="80" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="danger" icon="Delete" circle size="small"
                         @click="removeRow(formData.prices, row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- ================= 8. 库存分布 (Stocks 子表) ================= -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <el-icon><Box/></el-icon>
              <span>区域库存分布</span></div>
            <el-button v-if="isEditing" type="primary" link icon="Plus"
                       @click="addRow(formData.stocks, {area: '', num: 0, desc: '有货'})">添加区域库存
            </el-button>
          </div>
        </template>
        <el-table :data="visibleStocks" border stripe>
          <el-table-column label="所在区域/仓库" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.area" :disabled="!isEditing" @change="markUpdate(row)"
                        placeholder="如：华东总仓"/>
            </template>
          </el-table-column>
          <el-table-column label="库存数量" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :disabled="!isEditing" @change="markUpdate(row)"
                               :min="0" controls-position="right" style="width: 100%"/>
            </template>
          </el-table-column>
          <el-table-column label="库存状态描述" min-width="150">
            <template #default="{ row }">
              <el-input v-model="row.desc" :disabled="!isEditing" @change="markUpdate(row)"
                        placeholder="如：现货充足"/>
            </template>
          </el-table-column>
          <el-table-column v-if="isEditing" label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button type="danger" icon="Delete" circle size="small"
                         @click="removeRow(formData.stocks, row)"/>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ElMessage} from 'element-plus'
import {Box, InfoFilled, List, Money, Operation, Picture} from '@element-plus/icons-vue'
import type {ProductSaveReq} from "@/modules/edongfang/product/type/productSaveReq.ts";
import {
  getProductDetailApi,
  saveProductApi,
  updateProductApi
} from "@/modules/edongfang/product/api/product.ts";

defineOptions({name: 'ProductDetailView'})

const DEAL_TYPE = {SELECT: 0, INSERT: 1, UPDATE: 2, DELETE: 3}

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const mode = computed(() => route.params.mode as 'new' | 'edit' | 'view')
const sku = computed(() => route.params.sku as string)

// 🌟 核心控制逻辑：是否处于编辑状态
const isEditing = ref(mode.value === 'new')

// 🌟 修改：图片显示的计算属性需要严格按照 order 排序
const visibleImages = computed(() => {
  return formData.images
    .filter(r => r.dealType !== DEAL_TYPE.DELETE)
    .sort((a, b) => (a.order || 0) - (b.order || 0)) // 必须实时按 order 排序，这样改数字行才会动
})

// 🌟 新增：专门针对图片的新增行（自动计算下一个 Order）
const addImageRow = () => {
  const maxOrder = formData.images.length > 0
    ? Math.max(...formData.images.map(i => i.order || 0))
    : 0
  formData.images.push({ path: '', order: maxOrder + 1, dealType: DEAL_TYPE.INSERT })
}

/**
 * 🌟 核心细节：移动行逻辑
 * @param index 当前在 visibleImages 中的索引
 * @param direction -1 为上移，1 为下移
 */
const moveRow = (index: number, direction: number) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= visibleImages.value.length) return

  const currentRow = visibleImages.value[index]
  const targetRow = visibleImages.value[targetIndex]

  // 1. 交换两行的 order 值
  const tempOrder = currentRow.order
  currentRow.order = targetRow.order
  targetRow.order = tempOrder

  // 2. 标记两行都需要更新
  markUpdate(currentRow)
  markUpdate(targetRow)

  // 💡 提示：因为 visibleImages 是基于 order 排序的计算属性，
  // 只要 order 值一变，Vue 就会自动触发 Table 重新渲染，行位置瞬间交换。
}

const pageTitle = computed(() => {
  if (mode.value === 'new') return '新增商品'
  if (isEditing.value) return '编辑商品资料'
  return '商品详情展示'
})

// 初始化所有需要的字段
const formData = reactive<ProductSaveReq>({
  product: {
    sku: '', name: '', brandName: '', state: 1, imagePath: '', category: '', categoryName: '',
    introduction: '', searchKeyword: '', weight: 0, ware: '', unit: '',
    url: '', model: '', productArea: '', upc: '', service: '', param: '', taxRate: 0, taxCategoryCode: '', saleActives: 0
  },
  prices: [], images: [], params: [], stocks:[]
})

// ======= 核心状态机 =======

const visibleParams = computed(() => formData.params.filter(r => r.dealType !== DEAL_TYPE.DELETE))
const visiblePrices = computed(() => formData.prices.filter(r => r.dealType !== DEAL_TYPE.DELETE))
const visibleStocks = computed(() => formData.stocks.filter(r => r.dealType !== DEAL_TYPE.DELETE))

const addRow = (list: any[], defaultItem: any) => {
  list.push({...defaultItem, dealType: DEAL_TYPE.INSERT})
}

const removeRow = (list: any[], row: any) => {
  if (row.pk) {
    row.dealType = DEAL_TYPE.DELETE
  } else {
    const index = list.indexOf(row)
    if (index > -1) list.splice(index, 1)
  }
}

const markUpdate = (row: any) => {
  if (row.pk && row.dealType === DEAL_TYPE.SELECT) {
    row.dealType = DEAL_TYPE.UPDATE
  }
}

// ======= 业务流转 =======

onMounted(async () => {
  if (mode.value !== 'new' && sku.value) {
    await fetchDetail()
  }
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getProductDetailApi(sku.value)
    Object.assign(formData.product, res.product)

    formData.prices = (res.prices ||[]).map(i => ({...i, dealType: DEAL_TYPE.SELECT}))
    formData.params = (res.params ||[]).map(i => ({...i, dealType: DEAL_TYPE.SELECT}))
    formData.stocks = (res.stocks ||[]).map(i => ({...i, dealType: DEAL_TYPE.SELECT}))

    // 🌟 直接应用状态机逻辑，无需再用代理排序转换
    const originalImages = res.images ||[]
    formData.images = originalImages.map(i => ({...i, dealType: DEAL_TYPE.SELECT}))
    // 为了美观还是可以排个序，但不影响提交逻辑
    formData.images.sort((a, b) => a.order - b.order)

  } finally {
    loading.value = false
  }
}

// 交互逻辑：点击编辑
const startEdit = () => {
  isEditing.value = true
}

// 交互逻辑：点击取消
const cancelEdit = async () => {
  if (mode.value === 'new') {
    goBackList()
  } else {
    isEditing.value = false
    await fetchDetail()     // 重新拉取数据，丢弃未保存的修改
  }
}

// 🌟 保存逻辑
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitting.value = true
      try {
        if (mode.value === 'new') {
          await saveProductApi(formData)
          ElMessage.success('商品新增成功')
          isEditing.value = false
          router.replace(`/edongfang/product/detail/view/${formData.product.sku}`)
        } else {
          await updateProductApi(formData)
          ElMessage.success('商品修改成功')
          isEditing.value = false
          await fetchDetail()
        }
      } finally {
        submitting.value = false
      }
    } else {
      ElMessage.warning('表单校验未通过，请检查必填项')
    }
  })
}

// 退回列表页
const goBackList = () => router.push('/edongfang/product/list')

const rules = {
  'product.sku':[{required: true, message: '请输入商品SKU', trigger: 'blur'}],
  'product.name': [{required: true, message: '请输入商品名称', trigger: 'blur'}],
  'product.brandName': [{required: true, message: '请输入品牌', trigger: 'blur'}],
  // 🌟 修改为主图URL文本校验
  'product.imagePath':[{required: true, message: '请输入商品主图网址', trigger: 'blur'}]
}

</script>

<style scoped>
.product-detail-container {
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
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-header .el-icon {
  margin-right: 8px;
  vertical-align: middle;
  color: var(--el-color-primary);
}

.actions {
  display: flex;
  gap: 12px;
}

.ml-4 {
  margin-left: 16px;
}

/* 确保禁用状态下的文字颜色依然清晰 */
:deep(.el-input.is-disabled .el-input__inner) {
  -webkit-text-fill-color: var(--el-text-color-regular);
  color: var(--el-text-color-regular);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 8px !important;
}

/* 表格内组件间距微调 */
:deep(.el-table .el-input-number) {
  width: 100%;
}
</style>
