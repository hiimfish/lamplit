import { useEffect, useState } from 'preact/hooks';
import { stopAudio } from '../../audio/pronounce';
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
import { useRecorder } from './useRecorder';
import type { UseRecorder } from './useRecorder';

export function Speak({ question, onAnswered }: MinigameProps<SpeakQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [finished, setFinished] = useState(false);
  const rec = useRecorder();
  const pron = usePronScore();
  const micBusy = rec.phase === 'starting' || rec.phase === 'recording';

  const finish = (skipped: boolean) => {
    rec.release();
    pron.abort();
    const result = clock.finish(question.itemId, true, undefined, skipped);
    if (!result) return;
    setFinished(true);
    // QuestionView moves on to the next question at once (nothing to read here), so the model
    // is not replayed: it would be cut off as the question leaves.
    onAnswered(result);
  };

  const replay = () => play(question.audioId, question.en);
  const slow = () => {
    clock.markHelp();
    play(question.audioId, question.en, true);
  };

  // The model plays once as the sentence appears (normal speed, not help), unless the
  // learner has just heard this very line on an arrange check (角色扮演's 跟我說 step).
  useEffect(() => {
    if (!takeJustChecked(question.audioId)) replay();
  }, []);

  // Space 播放示範, Shift+Space 慢速 (help), Enter 我說完了. The mic keys (R, P, C) live in
  // MicControls, and the first-time download note takes Enter / Esc while it shows.
  useKeys(
    {
      Space: replay,
      'Shift+Space': slow,
      Enter: () => {
        if (!finished && !micBusy) finish(false);
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
        <SpeakReplay onReplay={replay} onSlow={slow} />
      </div>
      {!finished && (
        <>
          <MicControls rec={rec} pron={pron} target={question.en} />
          <div class="mg-row">
            <Btn
              primary
              id="done"
              label="我說完了"
              hint={pron.status === 'confirm' ? undefined : 'Enter'}
              disabled={micBusy}
              onClick={() => finish(false)}
            />
            <Btn
              id="skip"
              label="現在不方便說話"
              disabled={rec.phase === 'starting'}
              onClick={() => finish(true)}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** 錄音 / 停止 / 播放我的錄音 / 評分 and their notes. One microphone consumer at a time. */
function MicControls({
  rec,
  pron,
  target,
}: {
  rec: UseRecorder;
  pron: UsePronScore;
  target: string;
}) {
  const canScore = pronSupported();
  const micBusy = rec.phase === 'starting' || rec.phase === 'recording';
  const recordBlocked = rec.phase === 'starting' || pron.status !== 'idle';
  const record = () => {
    pron.clear();
    // The model (autoplayed or replayed) must not end up in the recording.
    stopAudio();
    rec.start();
  };
  const score = () => {
    if (!rec.blob) return;
    rec.clearMessage();
    pron.request(rec.blob, target);
  };
  const scoreShown = canScore && !micBusy && rec.blob !== null;
  // Fixed letter keys, since these buttons come and go: R 錄音 / 停止 (Record), P 播放我的錄音
  // (Play), C 評分 (Check). Each acts only when its button is shown and enabled.
  useKeys({
    r: () => {
      if (rec.phase === 'recording') rec.stop();
      else if (!recordBlocked) record();
    },
    p: () => {
      if (rec.url) rec.playMine();
    },
    c: () => {
      if (scoreShown && pron.status === 'idle') score();
    },
  });
  return (
    <>
      <div class="mg-row">
        {rec.phase === 'recording' ? (
          <Btn primary id="stop" label="停止" hint="r" onClick={rec.stop} />
        ) : (
          <Btn
            primary
            id="record"
            label="● 錄音"
            hint="r"
            disabled={recordBlocked}
            onClick={record}
          />
        )}
        {rec.url && <Btn id="play-mine" label="播放我的錄音" hint="p" onClick={rec.playMine} />}
        {scoreShown && (
          <Btn
            id="pron-score"
            label={SCORE_LABEL[pron.status]}
            hint="c"
            disabled={pron.status !== 'idle'}
            onClick={score}
          />
        )}
      </div>
      {micBusy && (
        <p class="mg-note">
          {rec.phase === 'starting' ? '正在開啟麥克風…' : '錄音中…說完請按停止'}
        </p>
      )}
      {canScore && !rec.blob && !micBusy && (
        <p class="mg-note" data-testid="pron-hint">
          錄音後可以按「評分」看發音分數。
        </p>
      )}
      {pron.status === 'confirm' && <PronNotice onConfirm={pron.confirm} onCancel={pron.cancel} />}
      {pron.status === 'downloading' && (
        <p class="mg-note" data-testid="pron-progress">
          下載發音模型 {Math.round(pron.progress * 100)}%
        </p>
      )}
      <SpeakNotes message={pron.message ?? rec.message} score={pron.score} />
    </>
  );
}

const SCORE_LABEL: Record<UsePronScore['status'], string> = {
  idle: '評分',
  confirm: '評分',
  downloading: '下載中…',
  scoring: '評分中…',
};

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

/** Same buttons as ReplayBar. */
function SpeakReplay(props: { onReplay: () => void; onSlow: () => void }) {
  return (
    <div class="mg-row">
      <Btn id="replay" label="♪ 播放示範" hint="Space" onClick={props.onReplay} />
      <Btn id="slow" label="慢速" hint="Shift+Space" onClick={props.onSlow} />
    </div>
  );
}

/** Shown before the first 評分 on this device: nothing is downloaded until 下載並評分. */
function PronNotice(props: { onConfirm: () => void; onCancel: () => void }) {
  // Registered after Speak's own keys, so here Enter is 下載並評分 (not 我說完了) and Esc 取消.
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

/** After 評分: the score (發音 N 分・level), then the words to practise. */
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
