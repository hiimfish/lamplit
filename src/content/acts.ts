/**
 * The four acts and their locations, in play order (docs/specs/curriculum.md).
 * A location is playable once a unit with its `unitId` exists in src/data/units;
 * until then the town shows it as coming soon. Locations with no `unitId` have
 * no unit id decided yet.
 */
export interface ActPlace {
  /** Name shown while the location has no unit; a unit's own title replaces it. */
  title: string;
  /** The same in the English interface. */
  titleEn?: string;
  unitId?: string;
}

export interface Act {
  /** 一, 二, 三, 四: shown as 第一幕 ... */
  no: string;
  title: string;
  /** The act's title in the English interface. */
  titleEn?: string;
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
    titleEn: 'A New Life',
    places: [
      { unitId: 'move_in', title: '搬家第一天', titleEn: 'Moving In' },
      { unitId: 'cafe', title: '咖啡廳', titleEn: 'The Café' },
      { unitId: 'store', title: '便利商店', titleEn: 'Convenience Store' },
      { unitId: 'street', title: '街道與公車站', titleEn: 'Street & Bus Stop' },
      { unitId: 'market', title: '超市與市集', titleEn: 'Supermarket & Market' },
      { unitId: 'clothes', title: '服飾店', titleEn: 'Clothes Shop' },
      { unitId: 'clinic', title: '診所與藥局', titleEn: 'Clinic & Pharmacy' },
      { unitId: 'restaurant', title: '餐廳與聚會', titleEn: 'Restaurant & Friends' },
      { unitId: 'post_office', title: '郵局', titleEn: 'Post Office' },
      { unitId: 'park', title: '公園與社區', titleEn: 'Park & Community' },
    ],
  },
  {
    no: '二',
    title: '找工作',
    titleEn: 'Finding a Job',
    places: [
      { unitId: 'bank', title: '銀行', titleEn: 'Bank' },
      { unitId: 'community_center', title: '社區中心', titleEn: 'Community Center' },
      { unitId: 'library', title: '圖書館', titleEn: 'Library' },
      { unitId: 'repair', title: '修車與維修', titleEn: 'Repairs' },
      { unitId: 'job_center', title: '就業服務站', titleEn: 'Job Center' },
      { unitId: 'resume', title: '履歷', titleEn: 'Resume Workshop' },
      { unitId: 'interview', title: '面試', titleEn: 'Job Interview' },
      { unitId: 'day_before', title: '上班前一天', titleEn: 'The Day Before Work' },
    ],
  },
  {
    no: '三',
    title: '上班第一年',
    titleEn: 'The First Year at Work',
    places: [
      { unitId: 'onboarding', title: '報到與人事', titleEn: 'Onboarding & HR' },
      { unitId: 'office', title: '辦公室日常', titleEn: 'Office Life' },
      { unitId: 'phone', title: '電話與留言', titleEn: 'Phone Calls and Messages' },
      { unitId: 'email', title: 'Email', titleEn: 'Email' },
      { unitId: 'meeting', title: '會議', titleEn: 'Meeting' },
      { unitId: 'purchasing', title: '採購與廠商', titleEn: 'Purchasing and Suppliers' },
      { unitId: 'warehouse', title: '倉庫與出貨', titleEn: 'Warehouse & Shipping' },
      { unitId: 'customer_service', title: '客戶服務', titleEn: 'Customer Service' },
      { unitId: 'airport', title: '機場', titleEn: 'Airport' },
      { unitId: 'hotel', title: '飯店', titleEn: 'Hotel' },
      { unitId: 'trade_fair', title: '商展', titleEn: 'Trade Fair' },
      { unitId: 'company_event', title: '公司活動', titleEn: 'Company Event' },
    ],
  },
  {
    no: '四',
    title: '升遷之路',
    titleEn: 'The Road to Promotion',
    places: [
      { unitId: 'presentation', title: '簡報', titleEn: 'Presentation' },
      { unitId: 'budget', title: '預算與報表', titleEn: 'Budget and Reports' },
      { unitId: 'marketing', title: '行銷', titleEn: 'Marketing' },
      { unitId: 'recruiting', title: '招募新人', titleEn: 'Recruiting' },
      { unitId: 'training', title: '教育訓練', titleEn: 'Training' },
      { unitId: 'legal', title: '合約與法務', titleEn: 'Contracts and Legal' },
      { unitId: 'factory', title: '工廠參觀', titleEn: 'Factory Visit' },
      { unitId: 'branch', title: '海外分公司', titleEn: 'The London Branch' },
      { unitId: 'wellness', title: '健康與福利', titleEn: 'Health and Benefits' },
      { unitId: 'media', title: '媒體採訪', titleEn: 'Media Interview' },
      { unitId: 'annual_meeting', title: '年度大會', titleEn: 'Annual Meeting' },
      { unitId: 'promotion', title: '結業挑戰', titleEn: 'Promotion Review' },
    ],
  },
];
