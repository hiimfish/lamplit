/**
 * 怎麼玩: four short cards shown on the first visit to the town (and again from 設定). A modal
 * dialog like 設定: ←/→ turn the cards, Space or Enter goes on, Esc skips; on a phone held
 * upright it is a page of its own (useFullScreen).
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { KeyCap } from './KeyCap';
import { useFullScreen } from './useFullScreen';
import { useModal } from './useModal';
import './howto.css';

export const HOW_CARDS: readonly { title: string; lines: readonly string[] }[] = [
  {
    title: '小鎮和任務',
    lines: [
      '按「開始」就玩下一關；想挑別的地點或重玩，按「選關」。',
      '任務一關一關打開，玩完一幕，下一幕就解鎖。',
      '已經有基礎？在「選關」點還沒開的那一幕，考過跳級考就能直接往後。',
    ],
  },
  {
    title: '每日目標',
    lines: ['每天要做的份量都在小鎮上方的「每日目標」。', '做完的項目會打勾。'],
  },
  {
    title: '今日複習和單字快練',
    lines: [
      '學過的字會在該複習的那天回來，今日複習會把它們練一遍。',
      '想多練幾輪，可以在每日目標裡開單字快練。',
    ],
  },
  {
    title: '結業考和路線',
    lines: [
      '每一幕的最後有結業考，看看這一幕學得怎麼樣。',
      '在每日目標裡選路線：照自己步調的一般路線，或 3 個月衝刺。',
    ],
  },
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
        怎麼玩
      </h2>
      <div class="intro-card how-card" aria-live="polite">
        <p class="how-step">
          {at + 1}／{HOW_CARDS.length}
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
          跳過
          <KeyCap k="Escape" />
        </button>
        <button
          type="button"
          class="pixel-button"
          aria-disabled={at === 0}
          onClick={() => go(-1)}
          data-testid="howto-prev"
        >
          上一張
          <KeyCap k="ArrowLeft" />
        </button>
        <button type="button" class="pixel-button primary" onClick={next} data-testid="howto-next">
          {last ? '開始玩' : '下一張'}
          <KeyCap k="Enter" />
        </button>
      </div>
    </div>
  );
}
