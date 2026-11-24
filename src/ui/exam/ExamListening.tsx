import { useEffect, useRef, useState } from 'preact/hooks';
import { PICTURE_H, PICTURE_W } from '../../art/pictures';
import { preloadAudio, stopAudio } from '../../audio/pronounce';
import { RESPONSE_MODE } from '../../content/exam';
import type { ResponseMode } from '../../content/exam';
import type {
  ClozeQuestion,
  PictureQuestion,
  Question,
  RespondQuestion,
  TalkQuestion,
} from '../../learning/questions';
import { digitIndex, letterIndex, useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import { KeyBadge } from '../minigames/shared';
import '../minigames/minigames.css';
import { optionLines, playInTurn } from '../minigames/ListenPicture';
import { pictureUrl } from '../minigames/PictureChoose';
import { playClips, respondClips } from '../minigames/Respond';
import { liveDeps, playConversation, TalkTableView } from '../minigames/Talk';
import type { ExamViewProps } from './types';
import './examListening.css';

const LETTERS = ['A', 'B', 'C', 'D'];

/** What the runner shows beside the question: how many plays remain. */
export function examPlayLabel(playsLeft: number): string {
  if (playsLeft === Infinity) return '不限次數';
  if (playsLeft <= 0) return '已經播過了';
  return `可以再聽 ${playsLeft} 次`;
}

/** One sound of a question: plays all of it, resolving true when every clip played to its end. */
export interface Sound {
  audioIds: string[];
  /** Plays the whole sound; `onStep` tells which clip is on. */
  play: (onStep: (index: number) => void, cancelled: () => boolean) => Promise<boolean>;
  /** Step number of the first option when the options are heard, else -1. */
  firstOptionStep: number;
}

const NO_SOUND: Sound = { audioIds: [], play: () => Promise.resolve(true), firstOptionStep: -1 };

function respondSound(q: RespondQuestion, mode: ResponseMode): Sound {
  const clips = respondClips(q);
  const order = mode === 'text' ? [0] : clips.map((_, i) => i);
  return {
    audioIds: order.map((i) => clips[i]!.audioId),
    firstOptionStep: mode === 'text' ? -1 : 1,
    play: (onStep, cancelled) => playClips(clips, order, onStep, cancelled, liveDeps),
  };
}

function talkSound(q: TalkQuestion): Sound {
  return {
    audioIds: q.lines.map((line) => line.audioId),
    firstOptionStep: -1,
    play: (onStep, cancelled) => playConversation(q.lines, onStep, cancelled, liveDeps),
  };
}

function pictureSound(q: PictureQuestion): Sound {
  const lines = optionLines(q);
  return {
    audioIds: lines.map((line) => line.audioId),
    firstOptionStep: 0,
    play: (onStep, cancelled) =>
      playInTurn(
        lines,
        (i) => {
          if (i >= 0) onStep(i);
        },
        cancelled,
        liveDeps,
      ),
  };
}

function clozeSound(q: ClozeQuestion): Sound {
  const line = {
    audioId: q.audioId,
    role: 'guide' as const,
    en: `${q.before} ${q.answer} ${q.after}`,
    zh: q.zh,
  };
  return {
    audioIds: [q.audioId],
    firstOptionStep: -1,
    play: (onStep, cancelled) => playConversation([line], onStep, cancelled, liveDeps),
  };
}

/** The sound of a question as the exam plays it; silent for a kind with no sound. */
export function soundOf(question: Question, mode: ResponseMode): Sound {
  switch (question.kind) {
    case 'respond':
      return respondSound(question, mode);
    case 'talk':
      return talkSound(question);
    case 'picture':
      return question.listen ? pictureSound(question) : NO_SOUND;
    case 'cloze':
      return clozeSound(question);
    default:
      return NO_SOUND;
  }
}

interface ShownOption {
  id: string;
  /** Text to show; undefined for a letters-only key. */
  label?: string;
}

function shownOptions(question: Question, mode: ResponseMode): ShownOption[] {
  switch (question.kind) {
    case 'respond':
      return question.options.map((o) =>
        mode === 'audio' ? { id: o.id } : { id: o.id, label: o.en },
      );
    case 'picture':
      return question.options.map((o) => ({ id: o.id }));
    case 'talk':
    case 'cloze':
      return question.options.map((o) => ({ id: o.id, label: o.label }));
    default:
      return [];
  }
}

/** Only a talk's first question starts its sound; the later ones follow the same play. */
function startsSound(question: Question): boolean {
  return question.kind !== 'talk' || question.index === 0;
}

/**
 * One listening question of an exam. It plays its sound by itself when it appears (within
 * `playsLeft`), calls `onPlayed()` once for each complete play, and shows the options as
 * plain keys: the pick is a boxed highlight, never right or wrong. Nothing here tells the
 * answer: no Chinese, no slow play, no transcript.
 */
export function ExamListening(props: ExamViewProps) {
  const { exam, item, choice, onChoose, playsLeft } = props;
  const question = item.question;
  const mode = props.responseMode ?? RESPONSE_MODE[exam];
  const latest = useRef(props);
  latest.current = props;
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const token = useRef(0);
  const busy = useRef(false);
  const sound = soundOf(question, mode);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  const run = async () => {
    if (busy.current || latest.current.playsLeft <= 0) return;
    busy.current = true;
    const mine = ++token.current;
    const cancelled = () => token.current !== mine;
    stopAudio();
    setPlaying(true);
    const done = await soundRef.current.play((i) => {
      if (!cancelled()) setStep(i);
    }, cancelled);
    if (cancelled()) return;
    busy.current = false;
    setPlaying(false);
    setStep(-1);
    if (done) latest.current.onPlayed();
  };

  useEffect(() => {
    preloadAudio(soundRef.current.audioIds);
    if (startsSound(question) && playsLeft > 0) void run();
    return () => {
      token.current++;
      busy.current = false;
      stopAudio();
    };
  }, []);

  const options = shownOptions(question, mode);
  const canReplay = playsLeft > 0 && !playing && sound.audioIds.length > 0;
  const keys: Record<string, () => void> = {};
  options.forEach((option, i) => {
    const pick = () => onChoose(option.id);
    if (digitIndex(String(i + 1), options.length) !== null) keys[String(i + 1)] = pick;
    const letter = LETTERS[i]?.toLowerCase();
    if (letter && letterIndex(letter, options.length) !== null) keys[letter] = pick;
  });
  useKeys(keys);
  useKeys({
    Space: () => {
      if (canReplay) void run();
    },
  });

  const heardOptions = sound.firstOptionStep >= 0;
  const optionStep = step - sound.firstOptionStep;
  const status = playing
    ? heardOptions && optionStep >= 0
      ? `正在播 ${LETTERS[optionStep] ?? ''}`
      : '正在播放…'
    : examPlayLabel(playsLeft);

  const url = question.kind === 'picture' ? pictureUrl(question.pictureId) : undefined;

  return (
    <div class="mg ex-listen" data-testid="exam-listening">
      {question.kind === 'talk' && question.table && <TalkTableView table={question.table} />}
      {question.kind === 'picture' && url && (
        <img
          class="ex-picture"
          src={url}
          width={PICTURE_W}
          height={PICTURE_H}
          alt=""
          data-picture={question.pictureId}
        />
      )}
      {question.kind === 'talk' && (
        <p class="ex-question" lang="en">
          {question.en}
        </p>
      )}
      {question.kind === 'cloze' && (
        <p class="ex-question" lang="en">
          {question.before} <span class="ex-blank">＿＿＿</span> {question.after}
        </p>
      )}
      <div class="mg-row">
        <button
          type="button"
          class="pixel-button"
          data-testid="exam-replay"
          disabled={!canReplay}
          onClick={() => void run()}
        >
          ♪ {playsLeft <= 0 ? '已經播過了' : '再聽一次'}
          <KeyCap k="Space" />
        </button>
        <span class="ex-status" role="status" data-testid="exam-status">
          {status}
        </span>
      </div>
      <div class={`ex-options${options.some((o) => o.label === undefined) ? ' letters' : ''}`}>
        {options.map((option, i) => {
          const letter = LETTERS[i] ?? String(i + 1);
          const picked = choice === option.id;
          const now = heardOptions && playing && optionStep === i;
          return (
            <button
              type="button"
              key={option.id}
              class={`pixel-button mg-option ex-option${picked ? ' picked' : ''}${now ? ' on' : ''}`}
              data-testid={`option-${option.id}`}
              aria-pressed={picked}
              aria-label={option.label === undefined ? `選 ${letter}` : undefined}
              onClick={() => onChoose(option.id)}
            >
              <KeyBadge label={String(i + 1)} />
              <span class="ex-letter">{letter}</span>
              {option.label !== undefined && (
                <span class="ex-text" lang="en">
                  {option.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
