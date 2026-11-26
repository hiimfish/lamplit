/**
 * The first-visit questions (`screen === 'welcome'`, 2026-11-26), between 點一下開始 and the
 * town: 1. the player's level, 2. 一般 or 衝刺, 3. a last page with the 介面語言 that fits the
 * level (changeable) and what comes next: the 跳級考 for that level, or Act 1. One tap answers
 * each of the first two. 略過 leaves everything as it was. See src/learning/onboarding.ts.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { ACTS } from '../content/acts';
import { actName } from '../content/titles';
import { GA_ID, track } from '../core/analytics';
import { appStore, commitSave, currentNow } from '../core/appState';
import { t } from '../core/i18n';
import type { Route } from '../core/save';
import { LEVELS, settingsStore, type Level, type UiLang } from '../core/settings';
import { useStore } from '../core/store';
import { LEVEL_PLAN } from '../learning/onboarding';
import { SKIP_PASS, skipSections } from '../learning/skipExam';
import { chooseRoute, TASK_GOAL } from '../learning/sprint';
import './flow.css';
import { useRefocus } from './focus';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ROUTE_TIME } from './settings/RouteGroup';
import './welcome.css';

/**
 * Each level in both languages at once: this page shows before any 介面語言 was chosen, and
 * the English name helps a player who knows it better than the letters.
 */
export const LEVEL_TEXT: Record<Level, { name: string; en: string; zh: string }> = {
  a1: { name: 'A1 剛起步', en: 'Beginner', zh: '認得字母和一些單字，聽和說都還不太行。' },
  a2: { name: 'A2 基礎', en: 'Elementary', zh: '點餐、問路這類簡單對話大致可以。' },
  b1: { name: 'B1 中級', en: 'Intermediate', zh: '能聊生活和工作，多益大約 550 分。' },
  b2: { name: 'B2 中高級', en: 'Upper-intermediate', zh: '工作上能用英文，多益大約 785 分以上。' },
  c1: { name: 'C1 以上', en: 'Advanced', zh: '幾乎都聽得懂，能流利表達自己的想法。' },
};

type Step = 'level' | 'route' | 'plan';
const STEPS: readonly Step[] = ['level', 'route', 'plan'];

const actNo = (act: number): string => ACTS[act - 1]?.no ?? String(act);
const actLabel = (act: number): string => t(`第${actNo(act)}幕`, actName(act));

const goTown = () => appStore.set({ screen: 'town' });

export function WelcomeScreen() {
  const settings = useStore(settingsStore);
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<Level | null>(null);
  const [route, setRoute] = useState<Route['kind']>('normal');
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => playMusic('town'), []);
  useEffect(() => track('onboard_start'), []);
  useRefocus(headingRef, [step]);

  const plan = level ? LEVEL_PLAN[level] : undefined;
  // The count differs a little from one sitting to the next (the seed), so it is shown as 約.
  const skipTotal = useMemo(
    () => (plan?.skip ? skipSections(plan.skip, 1).reduce((n, s) => n + s.items.length, 0) : 0),
    [plan?.skip],
  );
  const skip = plan?.skip && skipTotal > 0 ? plan.skip : undefined;

  const pickLevel = (picked: Level) => {
    playSfx('click');
    setLevel(picked);
    setStep('route');
  };
  const pickRoute = (kind: Route['kind']) => {
    playSfx('click');
    setRoute(kind);
    // The last page is already in the language that fits the level.
    if (level) settingsStore.set({ uiLang: LEVEL_PLAN[level].uiLang });
    setStep('plan');
  };
  const back = () => {
    playSfx('click');
    setStep(STEPS[Math.max(0, STEPS.indexOf(step) - 1)] ?? 'level');
  };
  /** 略過: nothing is changed, and the questions do not come back. */
  const skipAll = () => {
    playSfx('click');
    track('onboard_done', { choice: 'skipped' });
    settingsStore.set({ onboarded: true });
    goTown();
  };
  const finish = (sitExam: boolean) => {
    if (!level) return;
    playSfx('click');
    commitSave(chooseRoute(appStore.get().save, route, currentNow()));
    settingsStore.set({ onboarded: true, level });
    track('onboard_done', {
      choice: sitExam ? 'exam' : 'act1',
      level,
      route,
      ui_lang: settingsStore.get().uiLang,
    });
    if (sitExam && skip) appStore.set({ screen: 'skip', activeSkip: skip, result: undefined });
    else goTown();
  };

  useKeys({
    Enter: step === 'plan' ? () => finish(!!skip) : undefined,
    Back: step === 'level' ? undefined : back,
  });

  const stepNo = STEPS.indexOf(step) + 1;
  return (
    <div class="flow" data-testid="welcome-screen">
      <div class="flow-card welcome">
        <h1 class="flow-title" ref={headingRef} tabIndex={-1}>
          {step === 'level'
            ? '你的英文程度？'
            : step === 'route'
              ? t('每天想花多少時間？', 'How much time a day?')
              : t('準備好了', 'All set')}
          <span class="welcome-step" aria-label={`${stepNo} / ${STEPS.length}`}>
            {stepNo}/{STEPS.length}
          </span>
        </h1>

        {step === 'level' && (
          <>
            <p class="flow-note">
              選最接近的一個，用來決定從哪裡開始。不確定就選低一點的，之後隨時可以考跳級考。
            </p>
            <div class="welcome-options" role="group" aria-label="英文程度">
              {LEVELS.map((id) => (
                <button
                  key={id}
                  type="button"
                  class="pixel-button welcome-option"
                  onClick={() => pickLevel(id)}
                  data-testid={`level-${id}`}
                >
                  <span class="welcome-option-name">
                    {LEVEL_TEXT[id].name}
                    <span lang="en"> {LEVEL_TEXT[id].en}</span>
                  </span>
                  <span class="welcome-option-note">{LEVEL_TEXT[id].zh}</span>
                </button>
              ))}
            </div>
            <div class="flow-actions">
              <button
                type="button"
                class="pixel-button small"
                onClick={skipAll}
                data-testid="welcome-skip"
              >
                略過
              </button>
            </div>
          </>
        )}

        {step === 'route' && (
          <>
            <p class="flow-note">
              {t(
                '之後可以在「設定 → 路線」隨時更改。',
                'You can change this anytime in Settings > Route.',
              )}
            </p>
            <div class="welcome-options" role="group" aria-label={t('路線', 'Route')}>
              <button
                type="button"
                class="pixel-button welcome-option"
                onClick={() => pickRoute('normal')}
                data-testid="welcome-route-normal"
              >
                <span class="welcome-option-name">
                  {t(
                    `一般：每天${ROUTE_TIME.normal[0]}`,
                    `Standard: ${ROUTE_TIME.normal[1]} a day`,
                  )}
                </span>
                <span class="welcome-option-note">
                  {t(
                    `照自己的步調，每天 ${TASK_GOAL.normal} 關劇情加一點新字和複習。`,
                    `At your own pace: ${TASK_GOAL.normal} story task a day, a few new words and review.`,
                  )}
                </span>
              </button>
              <button
                type="button"
                class="pixel-button welcome-option"
                onClick={() => pickRoute('sprint')}
                data-testid="welcome-route-sprint"
              >
                <span class="welcome-option-name">
                  {t(
                    `衝刺 3 個月：每天${ROUTE_TIME.sprint[0]}`,
                    `3-month sprint: ${ROUTE_TIME.sprint[1]} a day`,
                  )}
                </span>
                <span class="welcome-option-note">
                  {t(
                    `想在 3 個月內準備到多益 600 分：每天 ${TASK_GOAL.sprint} 關劇情，加上更多新字和複習。`,
                    `To be ready for TOEIC 600 in 3 months: ${TASK_GOAL.sprint} story tasks a day, plus more new words and review.`,
                  )}
                </span>
              </button>
            </div>
            <div class="flow-actions">
              <button
                type="button"
                class="pixel-button small"
                onClick={back}
                data-testid="welcome-back"
              >
                {t('上一步', 'Back')}
                <KeyCap k="Back" />
              </button>
            </div>
          </>
        )}

        {step === 'plan' && level && plan && (
          <>
            {plan.fit === 'beyond' && (
              <p class="flow-note welcome-fit" data-testid="welcome-fit">
                {t(
                  '老實說，這個遊戲可能不適合你：內容從 A1 到 B1（多益 600 分左右），對 C1 以上太簡單。還是想玩的話，可以考跳級考直接到最後一幕，練練聽力和口說。',
                  'Honestly, this game is probably not for you: it runs from A1 to B1 (about TOEIC 600), which is too easy at C1 and above. If you still want to look around, the skip test takes you straight to the last act for listening and speaking practice.',
                )}
              </p>
            )}
            {plan.fit === 'easy' && (
              <p class="flow-note welcome-fit" data-testid="welcome-fit">
                {t(
                  '這個遊戲的內容到 B1（多益 600 分左右）為止，對你可能偏簡單；最後一幕的職場內容最接近你的程度。',
                  'This game goes up to B1 (about TOEIC 600), so it may be easy for you. The last act, set at work, is the closest to your level.',
                )}
              </p>
            )}
            <div class="welcome-row">
              <span id="welcome-lang-label">{t('介面語言', 'Language')}</span>
              <div class="welcome-row-keys" role="radiogroup" aria-labelledby="welcome-lang-label">
                {(
                  [
                    ['zh', '中文'],
                    ['en', 'English'],
                  ] as [UiLang, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={settings.uiLang === value}
                    class={`pixel-button small${settings.uiLang === value ? ' primary' : ''}`}
                    onClick={() => {
                      playSfx('click');
                      settingsStore.set({ uiLang: value });
                    }}
                    data-testid={`welcome-lang-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <p class="flow-note">
              {settings.uiLang === 'en'
                ? 'The game speaks English to you, and Chinese translations are hidden. You can change this in Settings > Display.'
                : plan.uiLang === 'en'
                  ? '照你的程度建議用 English 介面（不顯示中文翻譯），多看一點英文。之後可以在「設定 → 顯示」更改。'
                  : '遊戲的說明用中文，英文句子旁邊有中文翻譯。之後可以在「設定 → 顯示」更改。'}
            </p>
            <p class="flow-note" data-testid="welcome-plan">
              {skip
                ? t(
                    `照你的程度，可以先考第${actNo(skip)}幕跳級考：約 ${skipTotal} 題，答對 ${Math.round(SKIP_PASS * 100)}% 以上就直接從${actLabel(skip + 1)}開始。沒考過也沒關係，可以再考或從頭玩。`,
                    `At your level you can sit the ${actName(skip)} skip test first: about ${skipTotal} questions; get ${Math.round(SKIP_PASS * 100)}% or more right and you start at ${actLabel(skip + 1)}. If you don't pass, you can retry or start from the beginning.`,
                  )
                : t(
                    '從第一幕「新生活」開始，一關一關來。',
                    'You start at Act 1, one task at a time.',
                  )}
            </p>
            {GA_ID !== '' && (
              <p class="flow-note welcome-small" data-testid="welcome-stats">
                {t(
                  '遊戲會送出匿名的使用統計（玩到哪裡、答對幾題），不含錄音和個人資料；可以在「設定 → 說明」關掉。',
                  'The game sends anonymous usage statistics (how far you got, how many you got right), never recordings or personal data. You can turn this off in Settings > Help.',
                )}
              </p>
            )}
            <div class="flow-actions">
              <button
                type="button"
                class="pixel-button small"
                onClick={back}
                data-testid="welcome-back"
              >
                {t('上一步', 'Back')}
                <KeyCap k="Back" />
              </button>
              {skip && (
                <button
                  type="button"
                  class="pixel-button"
                  onClick={() => finish(false)}
                  data-testid="welcome-act1"
                >
                  {t('從第一幕開始', 'Start at Act 1')}
                </button>
              )}
              <button
                type="button"
                class="pixel-button primary"
                onClick={() => finish(!!skip)}
                data-testid="welcome-go"
              >
                {skip ? t('考跳級考', 'Sit the skip test') : t('開始', 'Start')}
                <KeyCap k="Enter" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
