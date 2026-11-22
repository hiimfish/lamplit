import type { Role } from './types';

/** How each speaker is named in the Chinese UI (story bubbles, choose-reply prompt). */
export const ROLE_LABEL: Record<Role, string> = {
  barista: '店員',
  landlord: '房東',
  guide: '你',
};
