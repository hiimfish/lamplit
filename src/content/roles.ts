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
  guide: '你',
};
