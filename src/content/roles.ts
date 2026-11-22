import type { Role } from './types';

/** How each speaker is named in the Chinese UI (story bubbles, choose-reply prompt). */
export const ROLE_LABEL: Record<Role, string> = {
  barista: '店員',
  landlord: '房東',
  neighbor: '鄰居',
  clerk: '店員',
  passerby: '路人',
  driver: '司機',
  cashier: '收銀員',
  vendor: '攤販',
  assistant: '店員',
  receptionist: '櫃台',
  doctor: '醫生',
  pharmacist: '藥師',
  server: '服務生',
  friend: '朋友',
  postal_clerk: '郵局人員',
  volunteer: '志工',
  teller: '銀行行員',
  instructor: '課程老師',
  librarian: '圖書館員',
  mechanic: '修車師傅',
  counselor: '就業顧問',
  front_desk: '前台人員',
  manager: '主管',
  guide: '你',
};
