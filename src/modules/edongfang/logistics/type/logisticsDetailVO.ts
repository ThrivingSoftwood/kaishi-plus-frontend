// 全景详情 VO
import type {LogisticsVO} from "@/modules/edongfang/logistics/type/LogisticsVO.ts";
import type {LogisticsItemVO} from "@/modules/edongfang/logistics/type/LogisticsItemVO.ts";
import type {LogisticsTrackVO} from "@/modules/edongfang/logistics/type/LogisticsTrackVO.ts";

export interface LogisticsDetailVO {
  logistics: LogisticsVO
  items: LogisticsItemVO[]
  tracks: LogisticsTrackVO[]
}
