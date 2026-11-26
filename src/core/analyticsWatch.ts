/**
 * What 匿名使用統計 reports, worked out from the stores so the screens need no tracking code
 * of their own: each screen change, each finished round (the result screen's data), a change
 * of route, and how the pronunciation model's load went. The first-visit questions and the
 * exams send their own events (WelcomeScreen, SkipScreen, ExamScreen).
 */
import { preloadStore } from '../audio/pronPreload';
import { setUser, track, type TrackParams } from './analytics';
import { appStore, type AppState } from './appState';
import { settingsStore, type Settings } from './settings';
import { BUILD_ID } from './update';

export type TrackEvent = [name: string, params: TrackParams];

type Watched = Pick<AppState, 'screen' | 'activeTask' | 'activeExam' | 'activeSkip' | 'result'> & {
  save: Pick<AppState['save'], 'route'>;
};

/** The events a change of app state stands for. */
export function eventsBetween(prev: Watched, next: Watched): TrackEvent[] {
  const events: TrackEvent[] = [];
  if (next.screen !== prev.screen) {
    events.push([
      'page_view',
      {
        page_title: next.screen,
        unit: next.screen === 'task' ? next.activeTask?.unitId : undefined,
        task: next.screen === 'task' ? next.activeTask?.taskId : undefined,
        act:
          next.screen === 'exam'
            ? next.activeExam
            : next.screen === 'skip'
              ? next.activeSkip
              : undefined,
      },
    ]);
  }
  if (next.result && next.result !== prev.result) {
    const { kind, unitId, taskId, outcome } = next.result;
    events.push([
      `${kind}_done`,
      {
        unit: unitId,
        task: taskId,
        stars: outcome.stars,
        correct: outcome.correct,
        total: outcome.total,
        new_items: outcome.newItemIds.length,
      },
    ]);
  }
  if (next.save.route.kind !== prev.save.route.kind) {
    events.push(['route_change', { route: next.save.route.kind }]);
  }
  return events;
}

/** What GA4 keeps about the player. */
export function userProps(
  settings: Pick<Settings, 'level' | 'uiLang' | 'textSize'>,
  state: Watched,
  standalone: boolean,
): TrackParams {
  return {
    level: settings.level ?? 'unset',
    ui_lang: settings.uiLang,
    text_size: settings.textSize,
    route: state.save.route.kind,
    installed: standalone,
  };
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
}

/** Starts reporting; call once, after the first render. */
export function startAnalytics(): void {
  let prev = appStore.get();
  const user = () => setUser(userProps(settingsStore.get(), appStore.get(), isStandalone()));
  user();
  track('game_open', {
    version: BUILD_ID,
    played_tasks: Object.keys(prev.save.tasks).length,
    skip_to: prev.save.skipTo ?? 0,
  });
  appStore.subscribe((next) => {
    const events = eventsBetween(prev, next);
    const routeChanged = next.save.route.kind !== prev.save.route.kind;
    prev = next;
    if (routeChanged) user();
    for (const [name, params] of events) {
      if (name === 'page_view') {
        const here = `${window.location.origin}${window.location.pathname}`;
        track(name, { ...params, page_location: `${here}#/${String(params.page_title)}` });
      } else track(name, params);
    }
  });

  let lang = settingsStore.get().uiLang;
  let level = settingsStore.get().level;
  settingsStore.subscribe((settings) => {
    if (settings.uiLang === lang && settings.level === level) return;
    if (settings.uiLang !== lang) track('ui_lang_change', { ui_lang: settings.uiLang });
    lang = settings.uiLang;
    level = settings.level;
    user();
  });

  // The pronunciation model: how long the title screen's load took, and whether it worked.
  const startedAt = Date.now();
  let phase = preloadStore.get().phase;
  preloadStore.subscribe((state) => {
    if (state.phase === phase) return;
    phase = state.phase;
    if (phase !== 'ready' && phase !== 'failed') return;
    track('pron_model', {
      result: phase,
      cached: state.cached,
      seconds: Math.round((Date.now() - startedAt) / 1000),
    });
  });
}
