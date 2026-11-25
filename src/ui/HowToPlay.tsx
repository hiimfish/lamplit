/**
 * 怎麼玩: four short cards shown on the first visit to the town (and again from 設定). A modal
 * dialog like 設定: ←/→ turn the cards, Space or Enter goes on, Esc skips; on a phone held
 * upright it is a page of its own (useFullScreen).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { t } from '../core/i18n';
import { KeyCap } from './KeyCap';
import { useFullScreen } from './useFullScreen';
import { useModal } from './useModal';
import './howto.css';

interface HowCard {
  readonly title: string;
  readonly lines: readonly string[];
}

/** A card whose title and lines are read in the current 介面語言 (getters). */
function howCard(title: [zh: string, en: string], lines: [zh: string, en: string][]): HowCard {
  return {
    get title() {
      return t(...title);
    },
    get lines() {
      return lines.map((line) => t(...line));
    },
  };
}

export const HOW_CARDS: readonly HowCard[] = [
  howCard(
    ['小鎮和任務', 'The town and its tasks'],
    [
      [
        '在「今天的目標」的劇情任務按「開始」玩下一關；想挑別的地點或重玩，按「選關」。',
        'In "Today\'s goals", press "Start" on Story for the next task. To pick another place or replay, press "Levels".',
      ],
      [
        '任務一關一關打開，玩完一幕，下一幕就解鎖。',
        'Tasks open one by one. Finish an act and the next one opens.',
      ],
      [
        '已經有基礎？在「選關」點還沒開的那一幕，考過跳級考就能直接往後。',
        'Know some already? In "Levels", tap a locked act and pass its skip test to move ahead.',
      ],
    ],
  ),
  howCard(
    ['今天的目標', "Today's goals"],
    [
      [
        '每天要做的份量都在小鎮的「今天的目標」，按「開始」就能做。',
        'Each day\'s work is in the town\'s "Today\'s goals". Press "Start" to do it.',
      ],
      ['做完的項目會打勾。', 'Finished items get a check mark.'],
    ],
  ),
  howCard(
    ['今日複習和單字快練', 'Daily review and Word sprint'],
    [
      [
        '學過的字會在該複習的那天回來，今日複習會把它們練一遍。',
        'Words you learned come back on the day to review them. Daily review goes over them.',
      ],
      [
        '想多練幾輪，可以在今天的目標裡開單字快練。',
        'For more rounds, start a Word sprint from "Today\'s goals".',
      ],
    ],
  ),
  howCard(
    ['結業考和路線', 'Final exams and routes'],
    [
      [
        '每一幕的最後有結業考，看看這一幕學得怎麼樣。',
        'Each act ends with a final exam to see how well you learned it.',
      ],
      [
        '在設定的「路線」裡選：照自己步調的一般路線，或 3 個月衝刺。',
        'In Settings > "Route", pick the Standard route at your own pace, or a 3-month Sprint.',
      ],
    ],
  ),
];

/**
 * Whether to show the cards on arriving in the town: not yet seen, and no task played yet
 * (players from before the cards existed are not stopped by them).
 */
export function shouldShowIntro(seenIntro: boolean, playedTasks: number): boolean {
  return !seenIntro && playedTasks === 0;
}

const TITLE_ID = 'howto-title';

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [at, setAt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, onClose);
  useFullScreen();
  const last = at === HOW_CARDS.length - 1;
  const card = HOW_CARDS[at]!;

  const go = (step: number) => {
    const to = Math.min(HOW_CARDS.length - 1, Math.max(0, at + step));
    if (to === at) return;
    playSfx('click');
    setAt(to);
  };
  const next = () => (last ? onClose() : go(1));

  // Keys in a dialog are left alone by keys.ts, so the cards listen for their own.
  const keysRef = useRef({ go, next });
  keysRef.current = { go, next };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const onButton = e.target instanceof Element && !!e.target.closest('button');
      if (e.key === 'ArrowRight') keysRef.current.go(1);
      else if (e.key === 'ArrowLeft') keysRef.current.go(-1);
      else if ((e.key === 'Enter' || e.key === ' ') && !onButton) keysRef.current.next();
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={panelRef}
      class="pixel-panel how-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      tabIndex={-1}
      data-testid="howto"
    >
      <h2 class="how-title" id={TITLE_ID}>
        {t('怎麼玩', 'How to play')}
      </h2>
      <div class="intro-card how-card" aria-live="polite">
        <p class="how-step">
          {at + 1}
          {t('／', ' / ')}
          {HOW_CARDS.length}
        </p>
        <h3 class="how-heading">{card.title}</h3>
        {card.lines.map((line) => (
          <p key={line} class="how-line">
            {line}
          </p>
        ))}
      </div>
      <div class="how-dots" aria-hidden="true">
        {HOW_CARDS.map((item, index) => (
          <span key={item.title} class={`how-dot${index === at ? ' on' : ''}`} />
        ))}
      </div>
      <div class="how-actions">
        <button type="button" class="pixel-button" onClick={onClose} data-testid="howto-skip">
          {t('跳過', 'Skip')}
          <KeyCap k="Escape" />
        </button>
        <button
          type="button"
          class="pixel-button"
          aria-disabled={at === 0}
          onClick={() => go(-1)}
          data-testid="howto-prev"
        >
          {t('上一張', 'Back')}
          <KeyCap k="ArrowLeft" />
        </button>
        <button type="button" class="pixel-button primary" onClick={next} data-testid="howto-next">
          {last ? t('開始玩', "Let's play") : t('下一張', 'Next')}
          <KeyCap k="Enter" />
        </button>
      </div>
    </div>
  );
}
