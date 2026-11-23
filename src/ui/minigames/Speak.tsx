import { useEffect, useState } from 'preact/hooks';
import { stopAudio } from '../../audio/pronounce';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { useKeys } from '../keys';
import { takeJustChecked } from './Arrange';
import { isRecognitionSupported, RECOGNITION_NOTE } from '../../audio/recognize';
import type { SpokenComparison } from '../../audio/recognize';
import type { SpeakQuestion } from '../../learning/questions';
import { play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';
import { useRecognition } from './useRecognition';
import type { UseRecognition } from './useRecognition';
import { useRecorder } from './useRecorder';
import type { UseRecorder } from './useRecorder';

export function Speak({ question, onAnswered }: MinigameProps<SpeakQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [finished, setFinished] = useState(false);
  const rec = useRecorder();
  const recog = useRecognition(rec.pausePlayback);
  const micBusy = rec.phase === 'starting' || rec.phase === 'recording';

  const finish = (skipped: boolean) => {
    rec.release();
    recog.abort();
    const result = clock.finish(question.itemId, true, undefined, skipped);
    if (!result) return;
    setFinished(true);
    onAnswered(result);
    if (!skipped) play(question.audioId, question.en);
  };

  const listening = recog.status === 'listening';
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

  // Space 播放示範, Shift+Space 慢速 (help), Enter 我說完了. The mic keys stay tap or Tab.
  useKeys(
    {
      Space: () => {
        if (!listening) replay();
      },
      'Shift+Space': () => {
        if (!listening) slow();
      },
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
        <SpeakReplay onReplay={replay} onSlow={slow} disabled={listening} />
      </div>
      {!finished && (
        <>
          <MicControls rec={rec} recog={recog} target={question.en} />
          <div class="mg-row">
            <Btn
              primary
              id="done"
              label="我說完了"
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

/** 錄音 / 停止 / 播放我的錄音 / 辨識 and their notes. One microphone consumer at a time. */
function MicControls({
  rec,
  recog,
  target,
}: {
  rec: UseRecorder;
  recog: UseRecognition;
  target: string;
}) {
  const canRecognize = isRecognitionSupported();
  const listening = recog.status === 'listening';
  const micBusy = rec.phase === 'starting' || rec.phase === 'recording';
  const recordBlocked = rec.phase === 'starting' || recog.status !== 'idle';
  const record = () => {
    recog.clear();
    // The model (autoplayed or replayed) must not end up in the recording.
    stopAudio();
    rec.start();
  };
  const recognize = () => {
    rec.clearMessage();
    recog.request(target);
  };
  return (
    <>
      <div class="mg-row">
        {rec.phase === 'recording' ? (
          <Btn primary id="stop" label="停止" onClick={rec.stop} />
        ) : (
          <Btn primary id="record" label="● 錄音" disabled={recordBlocked} onClick={record} />
        )}
        {rec.url && (
          <Btn id="play-mine" label="播放我的錄音" disabled={listening} onClick={rec.playMine} />
        )}
        {canRecognize && !micBusy && (
          <Btn
            id="recognize"
            label={listening ? '聽你說…' : '辨識'}
            disabled={recog.status !== 'idle'}
            onClick={recognize}
          />
        )}
      </div>
      {micBusy && (
        <p class="mg-note">
          {rec.phase === 'starting' ? '正在開啟麥克風…' : '錄音中…說完請按停止'}
        </p>
      )}
      {recog.status === 'confirm' && (
        <RecognitionNotice onConfirm={recog.confirm} onCancel={recog.cancel} />
      )}
      <SpeakNotes message={recog.message ?? rec.message} heard={recog.heard} />
    </>
  );
}

interface BtnProps {
  id: string;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}

function Btn({ id, label, primary = false, disabled = false, onClick }: BtnProps) {
  return (
    <button
      type="button"
      class={primary ? 'pixel-button primary' : 'pixel-button'}
      data-testid={id}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/** Same buttons as ReplayBar, but they can be disabled while the recognizer is listening. */
function SpeakReplay(props: { onReplay: () => void; onSlow: () => void; disabled: boolean }) {
  const { onReplay, onSlow, disabled } = props;
  return (
    <div class="mg-row">
      <Btn id="replay" label="♪ 播放示範" disabled={disabled} onClick={onReplay} />
      <Btn id="slow" label="慢速" disabled={disabled} onClick={onSlow} />
    </div>
  );
}

/** Shown before the first recognition: nothing is sent until 繼續辨識. */
function RecognitionNotice(props: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <p class="mg-note" data-testid="recognize-note">
        {RECOGNITION_NOTE}
      </p>
      <div class="mg-row">
        <Btn primary id="recognize-confirm" label="繼續辨識" onClick={props.onConfirm} />
        <Btn id="recognize-cancel" label="取消" onClick={props.onCancel} />
      </div>
    </>
  );
}

function SpeakNotes(props: { message: string | null; heard: SpokenComparison | null }) {
  const { message, heard } = props;
  return (
    <>
      {message && (
        <p class="mg-note warn" data-testid="speak-message">
          {message}
        </p>
      )}
      {heard && (
        <p class="mg-note" data-testid="heard">
          {heard.missing.length === 0
            ? '每個字都聽到了，很棒！'
            : `沒聽到這些字：${heard.missing.join(' ')}`}
        </p>
      )}
    </>
  );
}
