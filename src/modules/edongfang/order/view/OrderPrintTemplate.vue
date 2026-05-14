<template>
  <Teleport to="body">
    <div id="print-teleport-wrapper" class="print-teleport-container">
      <div class="print-page">

        <!-- ================= 1. 头部 (Header) ================= -->
        <div class="print-header">
          <div class="logo-area">
            <!-- 请将 src 替换为你项目中的真实图片资产路径，例如 @/assets/logo.png -->
            <img src="@/shared/assets/kaishi/logo.png" alt="Kaishi Logo" class="logo-img" />
          </div>
          <div class="title-area">订 单</div>
          <div class="slogan-area">凯行天下<br />诗意芳华</div>
        </div>

        <!-- ================= 2. 订单号 ================= -->
        <div class="huge-order-no">{{ formatVal(orderData.eOrderId) }}</div>

        <!-- ================= 3. 主信息栅格 (极窄标签列) ================= -->
        <table class="print-table main-info-table">
          <!-- 🌟 优化：极大压缩了 Label 列的宽度，释放 Value 列的空间 -->
          <colgroup>
            <col style="width: 9%;">  <!-- Label 1 -->
            <col style="width: 24%;"> <!-- Value 1 -->
            <col style="width: 9%;">  <!-- Label 2 -->
            <col style="width: 24%;"> <!-- Value 2 -->
            <col style="width: 11%;"> <!-- Label 3 (为了发票账号稍微多留一点) -->
            <col style="width: 23%;"> <!-- Value 3 -->
          </colgroup>
          <tbody>
          <tr>
            <th class="label-col">数据库ID</th>
            <td class="value-col" colspan="5">{{ formatVal(orderData.pk) }}</td>
          </tr>
          <tr>
            <th class="label-col">E采订单号</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.eOrderId) }}</td>
            <th class="label-col">收货人</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.name) }}</td>
          </tr>
          <tr>
            <th class="label-col">一级域名</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.province) }}</td>
            <th class="label-col">一级地址</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.provinceName) }}</td>
          </tr>
          <tr>
            <th class="label-col">二级域名</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.city) }}</td>
            <th class="label-col">二级地址</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.cityName) }}</td>
          </tr>
          <tr>
            <th class="label-col">三级域名</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.county) }}</td>
            <th class="label-col">三级地址</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.countyName) }}</td>
          </tr>
          <tr>
            <th class="label-col">采购人</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.purchaser) }}</td>
            <th class="label-col">详情地址</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.address) }}</td>
          </tr>
          <tr>
            <th class="label-col">邮编</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.zip) }}</td>
            <th class="label-col">座机</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.phone) }}</td>
          </tr>
          <tr>
            <th class="label-col">手机</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.mobile) }}</td>
            <th class="label-col">邮箱</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.email) }}</td>
          </tr>
          <tr>
            <th class="label-col">发票抬头</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.invoiceTitle) }}</td>
            <th class="label-col">发票类型</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.invoiceType) }}</td>
          </tr>
          <tr>
            <th class="label-col">发票税号</th>
            <td class="value-col">{{ formatVal(orderData.invoiceTaxNum) }}</td>
            <th class="label-col">发票开户行</th>
            <td class="value-col">{{ formatVal(orderData.invoiceBank) }}</td>
            <th class="label-col">发票账号</th>
            <td class="value-col">{{ formatVal(orderData.invoiceBankAccount) }}</td>
          </tr>
          <tr>
            <th class="label-col">发票地址</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.invoiceAddress) }}</td>
            <th class="label-col">发票电话</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.invoicePhone) }}</td>
          </tr>
          <tr>
            <th class="label-col">支付方式</th>
            <td class="value-col" colspan="2">{{ formatVal(orderData.payment) }}</td>
            <th class="label-col">订单金额</th>
            <td class="value-col numeric-col order-price" colspan="2">{{ formatCurrency(orderData.orderPrice) }}</td>
          </tr>
          <tr>
            <th class="label-col">运费</th>
            <td class="value-col numeric-col" colspan="5">{{ formatCurrency(orderData.freight) }}</td>
          </tr>
          <tr>
            <th class="label-col">采购单位</th>
            <td class="value-col" colspan="5">{{ formatVal(orderData.depName) }}</td>
          </tr>
          <tr>
            <th class="label-col">下单人电话</th>
            <td class="value-col">{{ formatVal(orderData.purchaserPhone) }}</td>
            <th class="label-col">下单人手机</th>
            <td class="value-col">{{ formatVal(orderData.purchaserMobile) }}</td>
            <th class="label-col">下单人邮箱</th>
            <td class="value-col">{{ formatVal(orderData.purchaserEmail) }}</td>
          </tr>
          </tbody>
        </table>

        <!-- ================= 4. 明细表格 (强制等分宽) ================= -->
        <h3 class="detail-title">订单明细</h3>
        <table class="print-table details-table">
          <thead>
          <!-- 🌟 优化：去掉了所有 width 限制，借助 table-layout: fixed 完美等分 -->
          <tr>
            <th class="label-col text-center">序号</th>
            <th class="label-col text-center">E采平台订单</th>
            <th class="label-col text-center">商品名称</th>
            <th class="label-col text-center">商品编号</th>
            <th class="label-col text-center">数量</th>
            <th class="label-col text-center">含税单价</th>
            <th class="label-col text-center">未税单价</th>
            <th class="label-col text-center">税率</th>
            <th class="label-col text-center">未税总额</th>
            <th class="label-col text-center">含税总价</th>
            <th class="label-col text-center">税额合计</th>
            <th class="label-col text-center">客户物料名</th>
            <th class="label-col text-center">客户物料码</th>
            <th class="label-col text-center">商品备注</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in items" :key="index">
            <td class="value-col text-center">{{ index + 1 }}</td>
            <td class="value-col">{{ formatVal(item.eOrderId) }}</td>
            <td class="value-col">{{ formatVal(item.name) }}</td>
            <td class="value-col">{{ formatVal(item.sku) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.num, 0) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.price) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.nakedPrice) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.taxRate) }}%</td>
            <td class="value-col numeric-col">{{ formatNum(item.nakedPriceTotal) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.priceTotal) }}</td>
            <td class="value-col numeric-col">{{ formatNum(item.taxPriceTotal) }}</td>
            <td class="value-col">{{ formatVal(item.materialName) }}</td>
            <td class="value-col">{{ formatVal(item.materialCode) }}</td>
            <td class="value-col">{{ formatVal(item.description) }}</td>
          </tr>
          </tbody>
        </table>

        <!-- ================= 5. 签收区及打印人信息 ================= -->
        <!-- 🌟 修复：将其彻底暴露出来，恢复安全边界防止被打印机吞噬 -->
        <div class="footer-section">
          <table class="print-table signature-table">
            <tbody>
            <tr>
              <td class="sign-cell">签字确认 (签收人)：</td>
              <td class="sign-cell">签收日期：</td>
            </tr>
            </tbody>
          </table>

          <div class="print-meta-footer">
            <span>打印人：{{ printerName || '管理员' }}</span>
            <span>打印时间：{{ printTime }}</span>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  orderData: any,
  items: any[],
  printerName?: string
}>()

const printTime = ref('')

const formatVal = (val: any) => {
  if (val === null || val === undefined || val === '') return '-'
  return val
}

const formatNum = (val: any, decimals: number = 2) => {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  return isNaN(num) ? val : num.toFixed(decimals)
}

const formatCurrency = (val: any) => {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return val
  return '¥ ' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const getFormattedTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

onMounted(() => {
  printTime.value = getFormattedTime()

  const printNodes = document.querySelectorAll('#print-teleport-wrapper')
  if (printNodes.length > 1) {
    for (let i = 0; i < printNodes.length - 1; i++) {
      printNodes[i].remove()
    }
  }
})
</script>

<style>
/* 1. 屏幕模式下隐藏打印组件 */
@media screen {
  .print-teleport-container {
    display: none !important;
  }
}

/* 2. 打印模式下接管整个页面 */
@media print {
  body > *:not(.print-teleport-container) {
    display: none !important;
  }

  .print-teleport-container {
    display: block !important;
    position: static;
    width: 100%;
    background-color: white !important;
    margin: 0;
    padding: 0;
  }

  /* 🌟 修复 1：恢复安全的 8mm 边距，防止签收区被物理裁切，并通过系统打印对话框隐藏页眉页脚 */
  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }

  .print-page {
    color: #111827;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  /* 头部排版 */
  /* 头部排版 */
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #111827;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }

  .logo-area {
    display: flex;
    align-items: center;
  }

  .logo-img {
    height: 35px; /* 可根据你真实 Logo 的长宽比微调此高度 */
    max-width: 180px;
    object-fit: contain;
  }

  .title-area {
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 0.5em;
  }

  .slogan-area {
    font-size: 14px;
    font-weight: bold;
    color: #1e3a8a; /* 凯诗深蓝，让 slogan 更有质感 */
    letter-spacing: 2px;
  }
  /* 基础表格系统 */
  .print-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #E5E7EB;
    margin-bottom: 15px;
  }
  .main-info-table {
    table-layout: fixed;
  }
  .print-table th, .print-table td {
    border: 1px solid #E5E7EB;
    padding: 6px; /* 压缩 padding */
    word-break: break-word;
  }

  /* 🌟 修复 3：整体字号压缩 */
  .label-col {
    background-color: #F9FAFB !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 11px; /* 由 12 减到 11 */
    font-weight: 600;
    color: #374151;
    text-align: left;
  }
  .value-col {
    font-size: 12px; /* 由 14 减到 12 */
    color: #111827;
    text-align: left;
    background-color: #FFFFFF !important;
  }
  .numeric-col { text-align: right !important; }
  .text-center { text-align: center !important; }
  .order-price { font-weight: 800; font-size: 14px; color: #111827; }

  /* ================= 🌟 修复 2：明细表绝对等分 ================= */
  .detail-title {
    font-size: 15px;
    font-weight: 800;
    margin: 10px 0 8px 0;
    border-left: 4px solid #111827;
    padding-left: 8px;
  }

  .details-table {
    table-layout: fixed !important; /* 开启固定列宽分配 */
    width: 100%;
  }
  .details-table th, .details-table td {
    padding: 4px 2px; /* 极限压缩单元格间距 */
    word-wrap: break-word;
  }
  .details-table .label-col {
    font-size: 9px; /* 极致压缩，确保 14 列不重叠 */
    text-align: center;
  }
  .details-table .value-col {
    font-size: 9px; /* 极致压缩，确保数据完整 */
  }

  /* ================= 签收区及页脚 ================= */
  .footer-section {
    margin-top: 25px;
    page-break-inside: avoid; /* 防断页 */
  }
  .signature-table {
    margin-bottom: 8px;
    table-layout: fixed;
  }
  .sign-cell {
    width: 50%;
    height: 60px; /* 控制高度，不过度挤压页脚 */
    vertical-align: top;
    font-size: 12px;
    color: #111827;
    background-color: #FFFFFF !important;
    padding: 8px 10px !important;
  }

  .print-meta-footer {
    display: flex;
    justify-content: flex-end;
    gap: 20px;
    font-size: 11px;
    color: #374151;
    padding-right: 5px;
  }
}
</style>
