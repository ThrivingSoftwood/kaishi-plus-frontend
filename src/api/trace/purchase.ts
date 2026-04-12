// src/api/trace/purchase.ts
import request from '@/utils/request.ts'

// 1. 请求参数 DTO (对应后端的 PurchaseOrderTraceDTO)
/**
 * 排序条件项接口 (对应 Java 中的 SortItemDTO)
 */
export interface SortItemDTO {
  field?: string;
  ascFlag?: boolean;
}

/**
 * 进货订单跟踪 DTO (对应 Java 中的 PurchaseOrderTraceDTO)
 */
export interface PurchaseOrderTraceDTO {
  /** 查询全量到货标记 */
  queryPurchased?: boolean;

  /** 排序条件, key : field, value : ascFlag */
  sortInfo?: SortItemDTO[];

  /** 根据 sortInfo 拼接出来的排序 sql */
  orderBySql?: string;

  /** 分页相关：偏移量 */
  offset?: number;
  /** 分页相关：页码 */
  pageNo?: number;
  /** 分页相关：每页条数 */
  pageSize?: number;

  /** 订单号 */
  number?: string;

  /** 单据号 */
  vchcode?: number | null;

  /** 科目typeid */
  atypeid?: string;

  /** 往来单位typeid */
  btypeid?: string;

  /** 职员typeid */
  etypeid?: string;

  /** 仓库typeid */
  ktypeid?: string;

  /** 存货typeid */
  ptypeId?: string;

  /** 批号 */
  blockno?: string;

  /** 到期日期-起始 */
  minProdate?: string;

  /** 到期日期-结束 */
  maxProdate?: string;

  /** 行摘要 */
  comment?: string;

  /** 单据日期-起始 */
  minDate?: string;

  /** 单据日期-结束 */
  maxDate?: string;

  /** 表格位置 1主表格 2钱流单等把表格外数据作为明细记录的 5 赠品 6 销售单抹零 7次表格 */
  usedtype?: string;

  /** 会计期间 */
  period?: number;

  /** 最早会计期间 */
  minPeriod?: number;

  /** 最迟会计期间 */
  maxPeriod?: number;

  /** 单据类型 */
  vchtype?: number;

  /** 明细序号 */
  dlyorder?: number;

  /** 源明细序号 */
  sourceDlyOrder?: number;

  /** 源(进货订单)单号 */
  sourceVchcode?: number;

  /** 源(进货订单)单据类型 */
  sourceVchtype?: number;

  /** 部门id */
  projectId?: string;

  /** 单据类型 1、草稿 2、正式单据（没有审核流程的单据和审核流程走完了的单据）4、审核中单据 */
  draft?: number;

  /** 结算单位 */
  settleBtypeId?: string;

  /** 发票类型 */
  mtypeid?: string;

  /** 父单据类型 */
  parVchtype?: number;
}

// 2. 响应视图 VO (对应后端的 DlyBuyVO)
/**
 * 采购订单视图对象 (对应 Java 中的 DlyBuyVO)
 */
export interface DlyBuyVO {
  total? :number;

  // ========================== 1. 状态展示字段 (后端计算) ==========================

  /**
   * 订单状态名称：未到货、部分到货、已完成等
   * 逻辑：由后端根据 buyQty 与 stockedQty 比对生成
   */
  statusName?: string;

  /**
   * 状态标签颜色：danger(红), warning(黄), success(绿)
   * 适配 Element Plus 的 el-tag 类型
   */
  statusTag?: string;

  /**
   * 欠交数量 (计算字段)
   * 逻辑：buyQty - stockedQty
   */
  owedQty?: number;

  // ========================== 2. 采购计划信息 (A表核心+进销存简要信息) ==========================

  /** 进销存单据编号 */
  number?: string;

  /** 进销存单据摘要 */
  summary?: string;

  /** 单据编码 */
  vchCode?: number;

  /** 单据序号 */
  dlyOrder?: number;

  /** 单据日期 */
  date?: string;

  /** 业务类型全名 (btypeFullname) */
  btypeFullname?: string;

  /** 产品类型全名 (ptypeFullname) */
  ptypeFullname?: string;

  /** 单位全名 */
  unitFullname?: string;

  /** 采购数量 */
  buyQty?: number;

  /** 入库数量 */
  stockedQty?: number;

  /** 单价 */
  price?: number;

  /** 折扣总额 */
  discountTotal?: number;

  /** 备注 */
  comment?: string;

  /** 红冲原单号 */
  redOld?: string;

  /** 红冲标记 */
  redWord?: string;

  /** 项目类型全名 (etypeFullname) */
  etypeFullname?: string;

  /** 栋号 */
  blockNo?: string;
}

// 3. API 调用方法
// 注意：由于你后端直接返回的是 List<DlyBuyVO>，所以泛型为 DlyBuyVO[]
export const getPurchaseListInfoApi = (data: PurchaseOrderTraceDTO) => {
  return request.post<any, DlyBuyVO[]>('/kaishi/trace/purchase/list/info', data)
}



// 对应后端的 PurchaseTraceVO
export interface PurchaseTraceVO {
  // 状态展示字段
  statusName: string
  statusTag: string
  owedQty: number

  // 采购计划信息 (A表核心)
  number: string
  summary: string
  aDate: string
  aVchcode: number
  aDlyOrder: number
  aBtypeidFullname: string
  aPtypeIdFullname: string
  aUnitName: string
  aQty: number
  aPrice: number
  aDiscounttotal: number
  aComment: string
  aRedOldName: string
  aEtypeidFullname: string
  aBlockno: string

  // 入库执行信息 (B表核心)
  bQty: number
  bDate: string
  bVchcode: number
  bDlyOrder: number
  bKtypeidFullname: string
}

// 获取具体单据的入库详情
export const getPurchaseDetailApi = (data: PurchaseOrderTraceDTO) => {
  return request.post<any, PurchaseTraceVO[]>('/kaishi/trace/purchase/list/detail', data)
}

/**
 * 手动置为完成 DTO
 */
export interface ManualFinishReq {
  vchType: number;
  vchCode: number;
  dlyOrder: number;
  extInfo: string;
}

/**
 * 手动置为完成 API
 */
export const manualFinishPurchaseApi = (data: ManualFinishReq) => {
  return request.post<any, any>('/kaishi/trace/purchase/manual/finish', data)
}
