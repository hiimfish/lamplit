import { showZhNow, t } from '../../core/i18n';
import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio } from '../../audio/pronounce';
import { pronNote, pronSupported } from '../../audio/pronModel';
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
 * 大聲說說看: the model plays once as the question opens, and when it ends the recording
 * starts by itself (說說看 does the same by hand): it stops a little after the learner
 * stops talking and shows the pronunciation score. Any key pressed while the model plays
 * (再聽, 慢速, 說說看, skip) cancels the automatic start. 下一題 moves on; 現在不方便說話
 * skips.
 */
export function Speak({ question, onAnswered }: MinigameProps<SpeakQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [finished, setFinished] = useState(false);
  const pron = usePronScore();
  const canScore = pronSupported();
  const scored = pron.score !== null;

  // Waiting for the model to finish before recording by itself.
  const [autoPending, setAutoPending] = useState(true);
  const auto = useRef(true);
  const cancelAuto = () => {
    auto.current = false;
    setAutoPending(false);
  };

  const finish = (skipped: boolean) => {
    cancelAuto();
    pron.abort();
    const result = clock.finish(question.itemId, true, undefined, skipped);
    if (!result) return;
    setFinished(true);
    // QuestionView moves on to the next question at once (nothing to read here).
    onAnswered(result);
  };

  const replay = () => {
    cancelAuto();
    play(question.audioId, question.en);
  };
  const slow = () => {
    cancelAuto();
    clock.markHelp();
    play(question.audioId, question.en, true);
  };
  const say = () => {
    cancelAuto();
    pron.press(question.en);
  };

  // The model plays once as the sentence appears (normal speed, not help), unless the
  // learner has just heard this very line on an arrange check (角色扮演's 跟我說 step);
  // then the recording starts by itself, a moment after the model ends.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if (!auto.current) return;
      if (canScore) say();
      else cancelAuto();
    };
    if (takeJustChecked(question.audioId)) start();
    else
      void playAudio(question.audioId, { speed: 'normal', text: question.en }).then(() => {
        timer = setTimeout(start, AUTO_RECORD_DELAY_MS);
      });
    return () => {
      auto.current = false;
      clearTimeout(timer);
    };
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
      <p class="mg-prompt">{t('大聲說說看', 'Say it aloud')}</p>
      <div class="mg-npc-row">
        <div class="mg-say">
          <p class="mg-sentence" data-testid="speak-en" lang="en">
            {question.en}
          </p>
          {showZhNow(showZh) && <p class="mg-zh">{question.zh}</p>}
        </div>
        <SpeakReplay onReplay={replay} onSlow={slow} disabled={busy} />
      </div>
      {!finished && (
        <>
          {canScore ? (
            <SayControls pron={pron} onSay={say} autoPending={autoPending} />
          ) : (
            <p class="mg-note" data-testid="pron-unsupported">
              {t(
                '這個瀏覽器不能評分，可以自己念一次再按「下一題」。',
                "This browser can't score. Say it once yourself, then press Next.",
              )}
            </p>
          )}
          <div class="mg-row">
            {(scored || !canScore) && (
              <Btn
                primary
                id="done"
                label={t('下一題', 'Next')}
                hint="Enter"
                onClick={() => finish(false)}
              />
            )}
            {!scored && canScore && (
              <Btn
                id="skip"
                label={t('現在不方便說話', "Can't talk now")}
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

/** Pause between the model's end and the automatic recording (not catching its tail). */
const AUTO_RECORD_DELAY_MS = 300;

const SAY_LABEL: Record<UsePronScore['status'], [zh: string, en: string]> = {
  idle: ['● 說說看', '● Say it'],
  confirm: ['● 說說看', '● Say it'],
  downloading: ['下載中…', 'Downloading…'],
  recording: ['● 聽你說…', '● Listening…'],
  scoring: ['評分中…', 'Scoring…'],
};

/** 說說看 / 再說一次, the first-time download note, progress and the score. */
function SayControls({
  pron,
  onSay,
  autoPending,
}: {
  pron: UsePronScore;
  onSay: () => void;
  /** The model is playing and the recording will start by itself after it. */
  autoPending: boolean;
}) {
  const scored = pron.score !== null;
  const label =
    pron.status === 'idle' && scored ? t('再說一次', 'Say it again') : t(...SAY_LABEL[pron.status]);
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
          {autoPending
            ? t(
                '先聽一次，聽完就會開始錄音，跟著說出來。',
                'Listen once. Recording starts when it ends, then say it.',
              )
            : t(
                '按「說說看」後直接說，說完停一下就會評分。',
                'Press Say it and speak. Pause when you finish and it scores.',
              )}
        </p>
      )}
      {pron.status === 'recording' && (
        <p class="mg-note" data-testid="say-recording">
          {t(
            '聽你說…說完停一下就會評分（再按一次可以提早結束）',
            'Listening… Pause when you finish and it scores (press again to stop early)',
          )}
        </p>
      )}
      {pron.status === 'confirm' && <PronNotice onConfirm={pron.confirm} onCancel={pron.cancel} />}
      {pron.status === 'downloading' && (
        <p class="mg-note" data-testid="pron-progress">
          {t('下載發音模型', 'Downloading the pronunciation model')}{' '}
          {Math.round(pron.progress * 100)}%
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
        label={`♪ ${t('播放示範', 'Play model')}`}
        hint="Space"
        disabled={props.disabled}
        onClick={props.onReplay}
      />
      <Btn
        id="slow"
        label={t('慢速', 'Slow')}
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
        {pronNote()}
      </p>
      <div class="mg-row">
        <Btn
          primary
          id="pron-confirm"
          label={t('下載並評分', 'Download & score')}
          hint="Enter"
          onClick={props.onConfirm}
        />
        <Btn id="pron-cancel" label={t('取消', 'Cancel')} hint="Escape" onClick={props.onCancel} />
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
          {unclear.length === 0
            ? t('每個字都很清楚，很棒！', 'Every word was clear. Great!')
            : t(`再練習：${unclear.join(' ')}`, `Practice: ${unclear.join(' ')}`)}
        </p>
      )}
    </>
  );
}
