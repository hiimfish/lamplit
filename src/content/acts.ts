/**
 * The four acts and their locations, in play order (docs/specs/curriculum.md).
 * A location is playable once a unit with its `unitId` exists in src/data/units;
 * until then the town shows it as coming soon. Locations with no `unitId` have
 * no unit id decided yet.
 */
export interface ActPlace {
  /** Name shown while the location has no unit; a unit's own title replaces it. */
  title: string;
  unitId?: string;
}

export interface Act {
  /** 一, 二, 三, 四: shown as 第一幕 ... */
  no: string;
  title: string;
  places: readonly ActPlace[];
}

/** The number of the act (1 to 4) a unit is in, or 0 when no act lists it (a test unit). */
export function actOf(unitId: string, acts: readonly Act[]): number {
  return acts.findIndex((act) => act.places.some((place) => place.unitId === unitId)) + 1;
}

/**
 * How many tasks a unit of each act has, the last one the role-play: 8 in Acts 1 and 2,
 * 9 from Act 3 on (index 0 is Act 1). A unit in no act may have any number.
 */
export const TASKS_PER_UNIT: readonly number[] = [8, 8, 9, 9];

export const ACTS: readonly Act[] = [
  {
    no: '一',
    title: '新生活',
    places: [
      { unitId: 'move_in', title: '搬家第一天' },
      { unitId: 'cafe', title: '咖啡廳' },
      { unitId: 'store', title: '便利商店' },
      { unitId: 'street', title: '街道與公車站' },
      { unitId: 'market', title: '超市與市集' },
      { unitId: 'clothes', title: '服飾店' },
      { unitId: 'clinic', title: '診所與藥局' },
      { unitId: 'restaurant', title: '餐廳與聚會' },
      { unitId: 'post_office', title: '郵局' },
      { unitId: 'park', title: '公園與社區' },
    ],
  },
  {
    no: '二',
    title: '找工作',
    places: [
      { unitId: 'bank', title: '銀行' },
      { unitId: 'community_center', title: '社區中心' },
      { unitId: 'library', title: '圖書館' },
      { unitId: 'repair', title: '修車與維修' },
      { unitId: 'job_center', title: '就業服務站' },
      { unitId: 'resume', title: '履歷' },
      { unitId: 'interview', title: '面試' },
      { unitId: 'day_before', title: '上班前一天' },
    ],
  },
  {
    no: '三',
    title: '上班第一年',
    places: [
      { unitId: 'onboarding', title: '報到與人事' },
      { unitId: 'office', title: '辦公室日常' },
      { unitId: 'phone', title: '電話與留言' },
      { unitId: 'email', title: 'Email' },
      { unitId: 'meeting', title: '會議' },
      { unitId: 'purchasing', title: '採購與廠商' },
      { unitId: 'warehouse', title: '倉庫與出貨' },
      { unitId: 'customer_service', title: '客戶服務' },
      { unitId: 'airport', title: '機場' },
      { unitId: 'hotel', title: '飯店' },
      { unitId: 'trade_fair', title: '商展' },
      { unitId: 'company_event', title: '公司活動' },
    ],
  },
  {
    no: '四',
    title: '升遷之路',
    places: [
      { unitId: 'presentation', title: '簡報' },
      { unitId: 'budget', title: '預算與報表' },
      { unitId: 'marketing', title: '行銷' },
      { unitId: 'recruiting', title: '招募新人' },
      { unitId: 'training', title: '教育訓練' },
      { unitId: 'legal', title: '合約與法務' },
      { unitId: 'factory', title: '工廠參觀' },
      { unitId: 'branch', title: '海外分公司' },
      { unitId: 'wellness', title: '健康與福利' },
      { unitId: 'media', title: '媒體採訪' },
      { unitId: 'annual_meeting', title: '年度大會' },
      { unitId: 'promotion', title: '結業挑戰' },
    ],
  },
];
