

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
