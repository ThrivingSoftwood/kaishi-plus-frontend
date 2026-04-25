import type {SortItemDTO} from "./sortItemDTO.ts";


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
