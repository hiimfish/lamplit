/**
 * 匿名使用統計 (2026-11-26): Google Analytics 4 events, so the author can see how the game
 * is used (which level players pick, where they stop, whether they come back). Nothing is
 * sent until GA_ID is filled in, and never from the dev server, a `?debugDate` session, or
 * with 設定 → 說明 → 匿名使用統計 off. Only counts and ids of the game's own content go out:
 * no recordings, no typed text, no save code.
 *
 * Every event goes through track(); the rest of the game never touches gtag.
 */
import { settingsStore } from './settings';

/** The GA4 measurement id (`G-XXXXXXXXXX`). Empty: analytics is off everywhere. */
export const GA_ID: string = 'G-7ZS9LZB36R';

export type TrackParams = Record<string, string | number | boolean | undefined>;

export interface AnalyticsEnv {
  id: string;
  dev: boolean;
  /** window.location.search */
  search: string;
  /** The 匿名使用統計 setting. */
  allowed: boolean;
}

/** Whether events may be sent at all. */
export function analyticsOn(env: AnalyticsEnv): boolean {
  if (!/^G-[A-Z0-9]+$/.test(env.id)) return false;
  if (env.dev || !env.allowed) return false;
  return !new URLSearchParams(env.search).has('debugDate');
}

/** Drops unset values and cuts long strings (GA4 keeps 100 characters of a value). */
export function cleanParams(params: TrackParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    out[key] = typeof value === 'string' ? value.slice(0, 100) : value;
  }
  return out;
}

type GtagWindow = Window & { dataLayer?: unknown[] } & Record<string, unknown>;

let loaded = false;

/** gtag reads the `arguments` object itself, not an array, so this cannot be an arrow. */
function gtag(...args: unknown[]): void;
function gtag(): void {
  // eslint-disable-next-line prefer-rest-params
  (window as unknown as GtagWindow).dataLayer?.push(arguments);
}

function ready(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as GtagWindow;
  const on = analyticsOn({
    id: GA_ID,
    dev: import.meta.env.DEV,
    search: window.location.search,
    allowed: settingsStore.get().analytics,
  });
  // Google's own switch: once the script is in, this stops it sending anything more.
  if (loaded) win[`ga-disable-${GA_ID}`] = !on;
  if (!on) return false;
  if (!loaded) {
    loaded = true;
    win.dataLayer = win.dataLayer ?? [];
    gtag('js', new Date());
    // Screens are reported by hand (the game is one page), so no automatic page view.
    gtag('config', GA_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }
  return true;
}

/** Sends one event; does nothing while analytics is off. Never throws. */
export function track(name: string, params: TrackParams = {}): void {
  try {
    if (import.meta.env.DEV) console.debug('[analytics]', name, cleanParams(params));
    if (ready()) gtag('event', name, cleanParams(params));
  } catch {
    // statistics must never break the game
  }
}

/** Sets what GA4 keeps about this player (level, route, language...). */
export function setUser(props: TrackParams): void {
  try {
    if (ready()) gtag('set', 'user_properties', cleanParams(props));
  } catch {
    // as above
  }
}
