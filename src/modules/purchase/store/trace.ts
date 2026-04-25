// src/store/trace.ts
import {defineStore} from 'pinia'
import {reactive, ref} from 'vue'
import type {DlyBuyVO} from "@/modules/purchase/type/DlyBuyVO.ts";
import type {PurchaseOrderTraceDTO} from "@/modules/purchase/type/PurchaseOrderTraceDTO.ts";
import {getPurchaseDetailApi, getPurchaseListInfoApi} from "@/modules/purchase/api/trace.ts";
import type {PurchaseTraceVO} from "@/modules/purchase/type/purchaseTraceVO.ts";

const needRefreshList = ref<boolean>(false)
export const useTraceStore = defineStore('trace', () => {
  const listInfo = ref<DlyBuyVO[]>([])
  const isLoading = ref<boolean>(false)
  const total = ref<number>(0) // 用于分页总数


  // 🌟 架构升级：将单例状态转变为字典（Map）状态，隔离不同路由的数据
  // Record<string, T> 中的 string 代表 route.name (如 'TraceFinishedPurchase')

  const listInfoMap = ref<Record<string, DlyBuyVO[]>>({})
  const isLoadingMap = ref<Record<string, boolean>>({})
  const totalMap = ref<Record<string, number>>({})

  // 查询参数字典
  const queryParamsMap = reactive<Record<string, PurchaseOrderTraceDTO>>({})

  const initModuleState = (routeKey: string, isPurchased: boolean): PurchaseOrderTraceDTO => {
    if (!queryParamsMap[routeKey]) {
      // 必须使用 set 或者直接赋值，触发响应式
      queryParamsMap[routeKey] = {
        pageNo: 1,
        pageSize: 20,
        queryPurchased: isPurchased,
        number: '',
        vchcode: undefined,
        dlyorder: undefined,
        minDate: '',
        maxDate: ''
      }
      listInfoMap.value[routeKey] = []
      totalMap.value[routeKey] = 0
      isLoadingMap.value[routeKey] = false
    }
    return queryParamsMap[routeKey]
  }

  const removeRecordOptimistically = (routerKey: string, vchCode: number, dlyOrder: number) => {
    // 1. 如果你目前用的是单例模式 (listInfo)
    if (listInfo.value && listInfo.value.length > 0) {
      listInfo.value = listInfo.value.filter(
        item => !(item.vchCode === vchCode && item.dlyOrder === dlyOrder)
      )
    }

    // 2. 如果你已经实施了多 Tab 的 Map 隔离模式 (listInfoMap)
    // 假设 "其他入库" 的 route name 是 TraceUnfinishedPurchase
    if (typeof listInfoMap.value !== 'undefined' && listInfoMap.value[routerKey]) {
      listInfoMap.value[routerKey] = listInfoMap.value[routerKey].filter(
        item => !(item.vchCode === vchCode && item.dlyOrder === dlyOrder)
      )
    }
  }

  // 2. 核心拉取动作：需要传入 routeKey 才知道把数据塞给谁
  const fetchListInfo = async (routeKey: string) => {
    isLoadingMap.value[routeKey] = true
    try {
      const data = await getPurchaseListInfoApi(queryParamsMap[routeKey] || {})
      listInfoMap.value[routeKey] = data || []

      // 分页总数逻辑
      const params = queryParamsMap[routeKey]
      totalMap.value[routeKey] = data[0]?.total ?? 0
    } catch (error) {
      console.error(`[${routeKey}] 获取列表失败:`, error)
    } finally {
      isLoadingMap.value[routeKey] = false
    }
  }

  // 3. 重置查询条件
  const resetQuery = (routeKey: string) => {
    const params = queryParamsMap[routeKey]
    if (params) {
      params.pageNo = 1
      params.number = ''
      params.vchcode = undefined
      params.dlyorder = undefined
      params.minDate = ''
      params.maxDate = ''
    }
  }


  // === 2. 详情列表状态 (🌟 新增) ===
  const detailList = ref<PurchaseTraceVO[]>([])
  const isDetailLoading = ref<boolean>(false)

  const fetchDetailList = async (req: PurchaseOrderTraceDTO) => {
    isDetailLoading.value = true
    try {
      // 默认给个分页，防止数据量过大
      const data = await getPurchaseDetailApi({
        ...req,
        pageNo: 1,
        pageSize: 500
      })
      detailList.value = data || []
    } catch (error) {
      console.error('获取入库详情失败:', error)
    } finally {
      isDetailLoading.value = false
    }
  }

  // === 3. 数据比对快照 (🌟 新增) ===
  // 当用户点击“比对”按钮时，我们将当前选中的行存入这里，供 Comparison.vue 读取
  const currentCompareItem = ref<PurchaseTraceVO | null>(null)

  const setCompareItem = (item: PurchaseTraceVO) => {
    currentCompareItem.value = item
  }

  return {
    listInfoMap,
    isLoadingMap,
    totalMap,
    queryParamsMap,
    initModuleState,
    fetchListInfo,
    resetQuery,
    detailList,
    isDetailLoading,
    fetchDetailList,
    currentCompareItem,
    setCompareItem,
    needRefreshList,
    removeRecordOptimistically,
  }
})
