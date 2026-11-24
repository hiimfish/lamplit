import { useEffect, useRef } from 'preact/hooks';
import { ROLE_LABEL } from '../content/roles';
import type { SceneLine } from '../content/types';
import { settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import type { SpokenMark } from '../learning/spokenScore';
import { KeyCap } from './KeyCap';
import './flow.css';

interface Props {
  /** The lines on screen, in order. */
  lines: readonly SceneLine[];
  /** Index of the newest line, drawn as current (typed out); -1 for none. */
  current: number;
  onPlay: (index: number, slow: boolean) => void;
  /** Key caps on the newest line (the story maps Space / Shift+Space to it). */
  keyHints?: boolean;
  /** Show the Chinese or not, in place of the saved 中文 setting (聽力加量 hides it). */
  zh?: boolean;
  /** Ids of the lines whose Chinese was opened one by one (with `onPeek`). */
  peeked?: ReadonlySet<string>;
  /** Adds a 「中」 key to each line that opens that line's Chinese; gets the line id. */
  onPeek?: (lineId: string) => void;
  /** Heard-word marks per line id, drawn under the English words (跟著說 scores). */
  marks?: Readonly<Record<string, readonly SpokenMark[]>>;
}

/** The 中文 key: shows or hides the Chinese under every line (a saved setting). */
/** `hint` shows the 0 key cap where the screen maps 0 to this key. */
export function ZhToggle({ hint = false }: { hint?: boolean }) {
  const { showZh } = useStore(settingsStore);
  return (
    <button
      class="pixel-button small"
      onClick={() => settingsStore.set({ showZh: !showZh })}
      aria-pressed={showZh}
    >
      中文：{showZh ? '開' : '關'}
      {hint && <KeyCap k="0" />}
    </button>
  );
}

/**
 * A chat log of boxed scene lines: each line is a key that plays it again, with a
 * 慢速 key beside it. Scrolls to the newest line whenever one is added.
 */
/** The English with each heard-word mark as an underline; plain if the marks do not line up. */
function MarkedText({ text, marks }: { text: string; marks: readonly SpokenMark[] }) {
  const parts = text.split(/(\s+)/);
  const words = parts.filter((part) => part !== '' && !/^\s+$/.test(part));
  if (words.length !== marks.length) return <>{text}</>;
  let at = 0;
  return (
    <>
      {parts.map((part) => {
        if (part === '' || /^\s+$/.test(part)) return part;
        const mark = marks[at++];
        if (!mark) return part;
        return mark.status === 'hit' || mark.free ? (
          part
        ) : (
          <span class={`mark-${mark.status}`}>{part}</span>
        );
      })}
    </>
  );
}

export function ChatLines({
  lines,
  current,
  onPlay,
  keyHints = false,
  zh,
  peeked,
  onPeek,
  marks,
}: Props) {
  const saved = useStore(settingsStore).showZh;
  const showZh = zh ?? saved;
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines.length]);

  return (
    <div class="chat" ref={listRef}>
      {lines.map((line, index) => {
        const lineMarks = marks?.[line.id];
        const open = peeked?.has(line.id) ?? false;
        return (
          <div key={line.id} class={`bubble-row ${line.speaker}`}>
            <button
              type="button"
              class={`bubble${index === current ? ' current' : ''}`}
              onClick={() => onPlay(index, false)}
            >
              <span class="bubble-who">
                {line.speaker === 'npc' ? ROLE_LABEL[line.role] : ROLE_LABEL.guide}
              </span>
              {keyHints && index === current && <KeyCap k="Space" />}
              <span class="bubble-en" lang="en">
                {lineMarks ? <MarkedText text={line.en} marks={lineMarks} /> : line.en}
              </span>
              {(showZh || open) && <span class="bubble-zh">{line.zh}</span>}
            </button>
            <button
              type="button"
              class="pixel-button small bubble-slow"
              onClick={() => onPlay(index, true)}
            >
              慢速
              {keyHints && index === current && <KeyCap k="Shift+Space" />}
            </button>
            {onPeek && !showZh && (
              <button
                type="button"
                class="pixel-button small bubble-peek"
                aria-pressed={open}
                aria-label="這句的中文"
                onClick={() => onPeek(line.id)}
              >
                中{keyHints && index === current && <KeyCap k="g" />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
