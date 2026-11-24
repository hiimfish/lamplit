import { useEffect, useRef, useState } from 'preact/hooks';
import { nowPlaying, playAudio, preloadAudio, stopAudio } from '../../audio/pronounce';
import { ROLE_LABEL } from '../../content/roles';
import type { Role, TalkTable } from '../../content/types';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { TalkQuestion } from '../../learning/questions';
import { focusLost, focusStatic } from '../focus';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import '../flow.css';
import './Talk.css';
import { ChoiceKeys, Feedback, FeedbackSlot, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

type TalkLine = TalkQuestion['lines'][number];

/** Quiet before the first line, so the speaker tags are seen before the voice starts. */
export const LEAD_IN_MS = 300;
/** Pause before a line when the other person answers, and when the same one goes on. */
export const PAUSE_NEW_SPEAKER_MS = 500;
export const PAUSE_SAME_SPEAKER_MS = 250;
/** How often browser speech is asked whether it is still talking. */
export const SPEECH_POLL_MS = 100;
/** Browser speech may take a moment to report that it has started. */
export const SPEECH_START_GRACE_MS = 400;

/**
 * Longest a line may take, loading included, before the conversation moves on anyway
 * (a suspended audio context or a speech engine that never reports its end must not
 * stop the learner from reaching the question). Generous: about twice a slow reading.
 */
export function lineTimeoutMs(text: string): number {
  return 4000 + 700 * text.split(/\s+/).filter(Boolean).length;
}

export function pauseBeforeMs(lines: readonly { role: string }[], index: number): number {
  if (index === 0) return LEAD_IN_MS;
  return lines[index - 1]?.role === lines[index]?.role
    ? PAUSE_SAME_SPEAKER_MS
    : PAUSE_NEW_SPEAKER_MS;
}

/** What the conversation player needs from the outside world (swapped out in tests). */
export interface ConversationDeps {
  /**
   * Plays one line. Resolves true once a clip has played to its end, false when there was
   * no clip (browser speech may have taken over, or nothing could be played).
   */
  play: (line: TalkLine) => Promise<boolean>;
  /** True while browser speech is talking or about to. */
  speechBusy: () => boolean;
  stop: () => void;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

/**
 * Plays the lines in order with a short pause between them, calling `onLine` as each one
 * starts. A clip is followed when it ends; browser speech (which playAudio does not wait
 * for) by polling until it falls silent; either way a line never takes longer than
 * lineTimeoutMs. Resolves true when every line was played, false once `cancelled()`.
 */
export async function playConversation(
  lines: readonly TalkLine[],
  onLine: (index: number) => void,
  cancelled: () => boolean,
  deps: ConversationDeps,
): Promise<boolean> {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    await deps.sleep(pauseBeforeMs(lines, i));
    if (cancelled()) return false;
    onLine(i);
    const timeout = lineTimeoutMs(line.en);
    const deadline = deps.now() + timeout;
    const outcome = await Promise.race([
      deps.play(line).then((clip) => (clip ? 'clip' : 'other')),
      deps.sleep(timeout).then(() => 'timeout' as const),
    ]);
    if (cancelled()) return false;
    if (outcome === 'timeout') deps.stop();
    else if (outcome === 'other') await waitForSpeech(deadline, cancelled, deps);
    if (cancelled()) return false;
  }
  return true;
}

async function waitForSpeech(
  deadline: number,
  cancelled: () => boolean,
  deps: ConversationDeps,
): Promise<void> {
  const graceEnd = deps.now() + SPEECH_START_GRACE_MS;
  let started = false;
  while (!cancelled() && deps.now() < deadline) {
    if (deps.speechBusy()) started = true;
    else if (started || deps.now() >= graceEnd) return;
    await deps.sleep(SPEECH_POLL_MS);
  }
  if (!cancelled()) deps.stop();
}

/** Plays a line's clip; true if the clip itself was heard (it then resolves at its end). */
async function playClip(line: TalkLine): Promise<boolean> {
  let heard = false;
  const unsubscribe = nowPlaying.subscribe((state) => {
    if (state.audioId === line.audioId) heard = true;
  });
  try {
    await playAudio(line.audioId, { text: line.en });
  } finally {
    unsubscribe();
  }
  return heard;
}

function browserSpeechBusy(): boolean {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking || window.speechSynthesis.pending;
  } catch {
    return false;
  }
}

/**
 * The real clip, browser-speech, timer and clock hooks for playConversation. Shared with
 * the other screens that play clips one after another (看圖聽句, 應答題).
 */
export const liveDeps: ConversationDeps = {
  play: playClip,
  speechBusy: browserSpeechBusy,
  stop: stopAudio,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

/** The Chinese wording of the screen, which differs for a monologue and a talk with a table. */
export interface TalkWords {
  prompt: string;
  /** Under the speaker tabs when nothing is playing. */
  idle: string;
  /** While it plays. */
  playing: string;
  /** Over the transcript, after answering. */
  transcript: string;
  /** In the feedback after a wrong pick. */
  wrongHint: string;
}

export function talkWords(question: Pick<TalkQuestion, 'monologue' | 'table'>): TalkWords {
  const what = question.monologue ? '獨白' : '對話';
  return {
    prompt: question.monologue
      ? '聽獨白，回答問題'
      : question.table
        ? '看表格，聽對話，回答問題'
        : '聽對話，回答問題',
    idle: `按「再聽一次」播放${what}`,
    playing: '仔細聽，聽完會出現問題',
    transcript: `${what}內容（點一句再聽一次）`,
    wrongHint: question.table
      ? `看看下面的${what}和上面的表格，找出答案。`
      : `看看下面的${what}，找出答案在哪一句。`,
  };
}

/** The fill of a speaker's name tab: paper, lamp-tint or lamp, each with ink text. */
export type SpeakerTone = 'paper' | 'tint' | 'lamp';
const TONES: readonly SpeakerTone[] = ['paper', 'tint', 'lamp'];

/**
 * 三人對話: each of three speakers gets its own name-tab fill, so who speaks reads at a
 * glance. You (`guide`) always get lamp-tint, as your lines have in the story; the others
 * take the remaining fills in the order they first speak. Two speakers or one keep the
 * plain paper tab (null).
 */
export function speakerTones(speakers: readonly Role[]): Map<Role, SpeakerTone> | null {
  if (speakers.length !== 3) return null;
  const tones = new Map<Role, SpeakerTone>();
  if (speakers.includes('guide')) tones.set('guide', 'tint');
  const free = TONES.filter((tone) => ![...tones.values()].includes(tone));
  for (const role of speakers) {
    if (!tones.has(role)) tones.set(role, free.shift()!);
  }
  return tones;
}

/** 只播一次: the note under the disabled 再聽一次. */
export const ONCE_NOTE = '只播一次，答完才能重聽';
/** 只播一次, when the talk was already played before the learner came back to it. */
export const ONCE_PLAYED_NOTE = '已經播過一次，答完才能重聽';

/**
 * 只播一次 talks that have started playing and whose last question is not answered yet,
 * by key (onceKey). Kept for the page's life, so leaving the task (先回小鎮) and coming
 * back cannot be used to hear the talk again; a page reload clears it. Answering the last
 * question on the talk removes it, so the task can be played again later.
 */
const playedOnce = new Set<string>();

/** The key of a talk across units: its first line's clip id is unique in the game. */
export function onceKey(question: Pick<TalkQuestion, 'lines' | 'talkId'>): string {
  return question.lines[0]?.audioId ?? question.talkId;
}

/**
 * True when the talk may play by itself as this question opens: the first question on it,
 * and for a 只播一次 talk only if it has not played already (it is then marked as played).
 */
export function claimAutoplay(
  question: Pick<TalkQuestion, 'lines' | 'talkId' | 'once' | 'index'>,
): boolean {
  if (question.index !== 0) return false;
  if (!question.once) return true;
  const key = onceKey(question);
  if (playedOnce.has(key)) return false;
  playedOnce.add(key);
  return true;
}

/** The last question on a 只播一次 talk is answered: it may play again next time. */
export function releaseOnce(question: Pick<TalkQuestion, 'lines' | 'talkId'>): void {
  playedOnce.delete(onceKey(question));
}

/** For tests: forget every played talk. */
export function resetPlayedOnce(): void {
  playedOnce.clear();
}

/**
 * 只播一次: replay and slow stay off until the last question on the talk is answered.
 * Always false for a talk that may be replayed.
 */
export function onceLocked(
  question: Pick<TalkQuestion, 'once' | 'index' | 'total'>,
  answered: boolean,
): boolean {
  return question.once === true && !(answered && question.index === question.total - 1);
}

/**
 * The table of a talk with a graphic (TOEIC Part 3 with a graphic): an optional title,
 * then the header row (solid ink, like the speaking tab) and the body rows ruled on paper.
 * It is shown from the start, so it can be read before and while listening, and stays
 * while answering. Plain text in the game's one font at the body size; long cells wrap
 * inside their column, so 4 columns of 3 words fit a phone held upright.
 */
export function TalkTableView({ table }: { table: TalkTable }) {
  const [header, ...rows] = table.rows;
  return (
    <div class="talk-table-box">
      {table.title && (
        <p class="talk-table-title" lang="en" data-testid="talk-table-title">
          {table.title}
        </p>
      )}
      <table class="talk-table" data-testid="talk-table" lang="en">
        {header && (
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 聽對話答題 (TOEIC Part 3): the conversation plays line by line with no text, only the two
 * speaker tags (the one talking marked) and a line count; then the question and its answers
 * show. The first question on a talk plays it; later questions on the same talk start at
 * the question. 再聽一次 plays the whole conversation again and counts as help. After
 * answering, the conversation shows as text, one boxed line per speech, each with its own
 * replay and 慢速 keys.
 *
 * 聽獨白答題 (Part 4, `monologue`): the same screen with one speaker tag (the role's
 * Chinese name); its 3 to 10 lines play with the short same-speaker pause, and the line
 * squares still fit on one row. In the transcript the name tag shows on the first line only.
 *
 * 聽對話答題加圖表 (Part 3 with a graphic, `table`): the table sits under the prompt from
 * the start and stays while listening and answering.
 *
 * 三人對話 (Act 4): three speaker tags, each with its own fill (speakerTones), and the
 * same fill on each line's name tag in the transcript, where the third speaker's lines sit
 * further in than the second's.
 *
 * 只播一次 (`once`): the talk plays once by itself as its first question opens, and never
 * again by itself in this page's life until its last question is answered (claimAutoplay),
 * so leaving and coming back does not replay it. Until then 再聽一次 is disabled with a
 * padlock and the note 只播一次，答完才能重聽; the transcript (with its replay and 慢速 keys)
 * stays hidden, as it would give away the later questions' answers. Answering the last
 * question unlocks all of it.
 */
export function Talk({ question, onAnswered }: MinigameProps<TalkQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [playing, setPlaying] = useState(false);
  /** Index of the line being heard during a whole-conversation play, or -1. */
  const [current, setCurrent] = useState(-1);
  /** Decided once as the question opens (it marks a 只播一次 talk as played). */
  const [autoplay] = useState(() => claimAutoplay(question));
  /** A 只播一次 talk that already played before the learner came back to it. */
  const playedBefore = question.once === true && question.index === 0 && !autoplay;
  const [heard, setHeard] = useState(!autoplay);
  const [picked, setPicked] = useState<string | null>(null);
  /** Bumped on every play and on unmount, so an older queue of lines stops. */
  const token = useRef(0);
  const questionRef = useRef<HTMLDivElement>(null);
  const answered = picked !== null;
  const showQuestion = answered || (heard && !playing);
  const isRight = picked === question.correctId;
  const answer = question.options.find((o) => o.id === question.correctId)?.label ?? '';
  const total = question.lines.length;
  const speaking = question.lines[current]?.role;
  const words = talkWords(question);
  /** 只播一次: nothing can be replayed before the last question on the talk is answered. */
  const locked = onceLocked(question, answered);
  const tones = speakerTones(question.speakers);
  const toneClass = (role: Role) => {
    const tone = tones?.get(role);
    return tone ? ` tone-${tone}` : '';
  };
  const speakerClass = (role: TalkLine['role']) =>
    (role === question.speakers[1] ? ' second' : role === question.speakers[2] ? ' third' : '') +
    toneClass(role);

  const playAll = async () => {
    const mine = ++token.current;
    const cancelled = () => token.current !== mine;
    stopAudio();
    setPlaying(true);
    setCurrent(-1);
    await playConversation(
      question.lines,
      (i) => {
        if (!cancelled()) setCurrent(i);
      },
      cancelled,
      liveDeps,
    );
    if (cancelled()) return;
    setPlaying(false);
    setCurrent(-1);
    setHeard(true);
  };

  /** One line of the transcript, after answering; stops a whole-conversation play. */
  const playLine = (index: number, slow: boolean) => {
    const line = question.lines[index];
    if (!line) return;
    token.current++;
    setPlaying(false);
    setCurrent(-1);
    play(line.audioId, line.en, slow);
  };

  useEffect(() => {
    preloadAudio(question.lines.map((line) => line.audioId));
    if (autoplay) void playAll();
    return () => {
      token.current++;
      stopAudio();
    };
  }, []);

  // The disabled 再聽一次 may have dropped focus while the conversation played.
  useEffect(() => {
    if (showQuestion && !answered && focusLost()) focusStatic(questionRef.current);
  }, [showQuestion]);

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    if (question.once && question.index === question.total - 1) releaseOnce(question);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  /** 再聽一次 (tap or Space): help before answering; never while a 只播一次 talk is locked. */
  const replay = () => {
    if (locked || playing) return;
    if (!answered) clock.markHelp();
    void playAll();
  };
  // Number keys pick an answer (ChoiceKeys, shown once the talk is heard); Space replays.
  useKeys({ Space: replay });

  return (
    <div
      class={`mg talk${question.monologue ? ' talk-monologue' : ''}${question.table ? ' talk-with-table' : ''}${tones ? ' talk-three' : ''}`}
    >
      <p class="mg-prompt">
        {words.prompt}
        {question.total > 1 && `（${question.index + 1}／${question.total}）`}
      </p>
      {question.table && <TalkTableView table={question.table} />}
      <div class="mg-row">
        <button
          type="button"
          class={`pixel-button${locked ? ' talk-locked' : ''}`}
          data-testid="talk-replay"
          disabled={playing || locked}
          aria-describedby={locked ? 'talk-once-note' : undefined}
          onClick={replay}
        >
          {locked && <span class="lock-mark" aria-hidden="true" />}♪ 再聽一次
          <KeyCap k="Space" />
        </button>
        {locked && (
          <span class="talk-once-note" id="talk-once-note" data-testid="talk-once-note">
            {playedBefore ? ONCE_PLAYED_NOTE : ONCE_NOTE}
          </span>
        )}
      </div>
      {showQuestion ? (
        <>
          <div class="mg-say talk-question" ref={questionRef} data-testid="talk-question">
            <p class="mg-sentence" lang="en">
              {question.en}
            </p>
            {showZh && <p class="mg-zh">{question.zh}</p>}
          </div>
          <ChoiceKeys
            options={question.options}
            correctId={question.correctId}
            picked={picked}
            onPick={choose}
          />
        </>
      ) : (
        <div class="talk-stage" data-testid="talk-listening">
          <div class="talk-speakers">
            {question.speakers.map((role) => {
              const on = role === speaking;
              return (
                <span
                  key={role}
                  class={`talk-speaker${toneClass(role)}${on ? ' on' : ''}`}
                  aria-current={on ? 'true' : undefined}
                >
                  <span class="talk-mark" aria-hidden="true">
                    {on ? '▶' : ''}
                  </span>
                  {ROLE_LABEL[role]}
                </span>
              );
            })}
          </div>
          <div class="talk-progress">
            <span class="talk-dots" aria-hidden="true">
              {question.lines.map((line, i) => (
                <span
                  key={line.audioId}
                  class={`talk-dot${i < current ? ' done' : i === current ? ' now' : ''}`}
                />
              ))}
            </span>
            <span class="talk-count" data-testid="talk-count">
              {current >= 0 ? `第 ${current + 1}／${total} 句` : `共 ${total} 句`}
            </span>
          </div>
          <p class="talk-hint" role="status">
            {playing ? words.playing : words.idle}
          </p>
        </div>
      )}
      <FeedbackSlot>
        {answered && (
          <Feedback
            correct={isRight}
            hint={isRight ? undefined : words.wrongHint}
            answer={answer}
            answerLabel="正確答案"
          />
        )}
      </FeedbackSlot>
      {answered && !locked && (
        <div class="talk-transcript" data-testid="talk-transcript">
          <p class="talk-transcript-title">{words.transcript}</p>
          {question.lines.map((line, i) => {
            const now = i === current;
            // A monologue has one speaker: the name tag on its first line is enough.
            const tagged = !question.monologue || i === 0 || now;
            return (
              <div key={line.audioId} class={`bubble-row talk-row${speakerClass(line.role)}`}>
                <button
                  type="button"
                  class={`bubble talk-bubble${now ? ' talk-now' : ''}`}
                  data-testid={`talk-line-${i}`}
                  aria-current={now ? 'true' : undefined}
                  onClick={() => playLine(i, false)}
                >
                  {tagged && (
                    <span class="bubble-who">
                      {now && (
                        <span class="talk-mark" aria-hidden="true">
                          ▶
                        </span>
                      )}
                      {ROLE_LABEL[line.role]}
                    </span>
                  )}
                  <span class="bubble-en" lang="en">
                    {line.en}
                  </span>
                  {showZh && <span class="bubble-zh">{line.zh}</span>}
                </button>
                <button
                  type="button"
                  class="pixel-button small bubble-slow talk-slow"
                  data-testid={`talk-slow-${i}`}
                  onClick={() => playLine(i, true)}
                >
                  慢速
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
