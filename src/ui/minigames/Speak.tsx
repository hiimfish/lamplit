import { useEffect, useState } from 'preact/hooks';
import { PRON_NOTE, pronSupported } from '../../audio/pronModel';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import { takeJustChecked } from './Arrange';
import { spokenScoreText, unclearWords } from '../../learning/spokenScore';
import type { SpokenScore } from '../../learning/spokenScore';
import type { SpeakQuestion } from '../../learning/questions';
import { play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';
import { usePronScore } from './usePronScore';
import type { UsePronScore } from './usePronScore';

/**
 * 大聲說說看: one key, 說說看, listens while the learner says the sentence, stops by itself
 * when they stop and shows the pronunciation score. 下一題 moves on; 現在不方便說話 skips.
 */
export function Speak({ question, onAnswered }: MinigameProps<SpeakQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [finished, setFinished] = useState(false);
  const pron = usePronScore();
  const canScore = pronSupported();
  const scored = pron.score !== null;

  const finish = (skipped: boolean) => {
    pron.abort();
    const result = clock.finish(question.itemId, true, undefined, skipped);
    if (!result) return;
    setFinished(true);
    // QuestionView moves on to the next question at once (nothing to read here).
    onAnswered(result);
  };

  const replay = () => play(question.audioId, question.en);
  const slow = () => {
    clock.markHelp();
    play(question.audioId, question.en, true);
  };
  const say = () => pron.press(question.en);

  // The model plays once as the sentence appears (normal speed, not help), unless the
  // learner has just heard this very line on an arrange check (角色扮演's 跟我說 step).
  useEffect(() => {
    if (!takeJustChecked(question.audioId)) replay();
  }, []);

  // Space 播放示範, Shift+Space 慢速 (help), R 說說看 / 再說一次, Enter 下一題 once scored
  // (before that, 說說看). The first-time download note takes Enter / Esc while it shows.
  const busy = pron.status !== 'idle';
  useKeys(
    {
      Space: () => {
        if (!busy) replay();
      },
      'Shift+Space': () => {
        if (!busy) slow();
      },
      r: () => {
        if (canScore && (pron.status === 'idle' || pron.status === 'recording')) say();
      },
      Enter: () => {
        if (busy) return;
        if (scored || !canScore) finish(false);
        else say();
      },
    },
    !finished,
  );

  return (
    <div class="mg">
      <p class="mg-prompt">大聲說說看</p>
      <div class="mg-npc-row">
        <div class="mg-say">
          <p class="mg-sentence" data-testid="speak-en" lang="en">
            {question.en}
          </p>
          {showZh && <p class="mg-zh">{question.zh}</p>}
        </div>
        <SpeakReplay onReplay={replay} onSlow={slow} disabled={busy} />
      </div>
      {!finished && (
        <>
          {canScore ? (
            <SayControls pron={pron} onSay={say} />
          ) : (
            <p class="mg-note" data-testid="pron-unsupported">
              這個瀏覽器不能評分，可以自己念一次再按「下一題」。
            </p>
          )}
          <div class="mg-row">
            {(scored || !canScore) && (
              <Btn primary id="done" label="下一題" hint="Enter" onClick={() => finish(false)} />
            )}
            {!scored && canScore && (
              <Btn
                id="skip"
                label="現在不方便說話"
                disabled={pron.status === 'recording' || pron.status === 'scoring'}
                onClick={() => finish(true)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

const SAY_LABEL: Record<UsePronScore['status'], string> = {
  idle: '● 說說看',
  confirm: '● 說說看',
  downloading: '下載中…',
  recording: '● 聽你說…',
  scoring: '評分中…',
};

/** 說說看 / 再說一次, the first-time download note, progress and the score. */
function SayControls({ pron, onSay }: { pron: UsePronScore; onSay: () => void }) {
  const scored = pron.score !== null;
  const label = pron.status === 'idle' && scored ? '再說一次' : SAY_LABEL[pron.status];
  return (
    <>
      <div class="mg-row">
        <Btn
          primary={!scored}
          id="say"
          label={label}
          hint="r"
          disabled={pron.status !== 'idle' && pron.status !== 'recording'}
          onClick={onSay}
        />
      </div>
      {pron.status === 'idle' && !scored && !pron.message && (
        <p class="mg-note" data-testid="say-hint">
          按「說說看」後直接說，說完停一下就會評分。
        </p>
      )}
      {pron.status === 'recording' && (
        <p class="mg-note" data-testid="say-recording">
          聽你說…說完停一下就會評分（再按一次可以提早結束）
        </p>
      )}
      {pron.status === 'confirm' && <PronNotice onConfirm={pron.confirm} onCancel={pron.cancel} />}
      {pron.status === 'downloading' && (
        <p class="mg-note" data-testid="pron-progress">
          下載發音模型 {Math.round(pron.progress * 100)}%
        </p>
      )}
      <SpeakNotes message={pron.message} score={pron.score} />
    </>
  );
}

interface BtnProps {
  id: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  /** A KeyCap shown after the label (a key name from keys.ts). */
  hint?: string;
}

function Btn({ id, label, hint, primary = false, disabled = false, onClick }: BtnProps) {
  return (
    <button
      type="button"
      class={primary ? 'pixel-button primary' : 'pixel-button'}
      data-testid={id}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
      {hint && <KeyCap k={hint} />}
    </button>
  );
}

/** Same buttons as ReplayBar; off while the microphone listens or the score is worked out. */
function SpeakReplay(props: { onReplay: () => void; onSlow: () => void; disabled: boolean }) {
  return (
    <div class="mg-row">
      <Btn
        id="replay"
        label="♪ 播放示範"
        hint="Space"
        disabled={props.disabled}
        onClick={props.onReplay}
      />
      <Btn
        id="slow"
        label="慢速"
        hint="Shift+Space"
        disabled={props.disabled}
        onClick={props.onSlow}
      />
    </div>
  );
}

/** Shown before the first 說說看 on this device: nothing is downloaded until 下載並評分. */
function PronNotice(props: { onConfirm: () => void; onCancel: () => void }) {
  // Registered after Speak's own keys, so here Enter is 下載並評分 and Esc 取消.
  useKeys({ Enter: props.onConfirm, Escape: props.onCancel });
  return (
    <>
      <p class="mg-note" data-testid="pron-note">
        {PRON_NOTE}
      </p>
      <div class="mg-row">
        <Btn primary id="pron-confirm" label="下載並評分" hint="Enter" onClick={props.onConfirm} />
        <Btn id="pron-cancel" label="取消" hint="Escape" onClick={props.onCancel} />
      </div>
    </>
  );
}

/** After 說說看: the score (發音 N 分・level), then the words to practise. */
function SpeakNotes(props: { message: string | null; score: SpokenScore | null }) {
  const { message, score } = props;
  const unclear = score ? unclearWords(score) : [];
  return (
    <>
      {message && (
        <p class="mg-note warn" data-testid="speak-message">
          {message}
        </p>
      )}
      {score && (
        <p class="mg-note" data-testid="heard">
          <span data-testid="speak-score">{spokenScoreText(score)}</span>
          <br />
          {unclear.length === 0 ? '每個字都很清楚，很棒！' : `再練習：${unclear.join(' ')}`}
        </p>
      )}
    </>
  );
}
