import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../audio/pronounce';
import type { Task, Unit } from '../content/types';
import { lineAudioId } from '../content/units';
import { currentNow } from '../core/appState';
import { settingsStore } from '../core/settings';
import { buildRolePlayTurns, makeRng, rolePlaySteps } from '../learning/questionGen';
import type { AnswerResult } from '../learning/questions';
import { ChatLines, ZhToggle } from './ChatLines';
import './flow.css';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { QuestionRunner } from './TaskScreen';

interface Props {
  unit: Unit;
  task: Task;
  /** Told how many scene lines are on screen (for the stage). */
  onShown: (shown: number) => void;
  onFinish: (results: AnswerResult[]) => void;
}

type Step = 'brief' | 'turns' | 'end';

/**
 * 角色扮演大挑戰: a fresh conversation with no script first. NPC lines appear and play
 * one by one; on each of the learner's turns they build their line from word blocks,
 * with only the conversation so far as the cue. The built line then joins the chat.
 * With 跟我說 on, the learner also says each built line aloud (not graded).
 */
export function RolePlay({ unit, task, onShown, onFinish }: Props) {
  const lines = task.scene;
  const turns = useMemo(
    () => buildRolePlayTurns(unit, task, makeRng(currentNow().getTime())),
    [unit, task],
  );
  const [speak, setSpeak] = useState(false);
  const steps = useMemo(() => rolePlaySteps(lines, turns, speak), [lines, turns, speak]);
  const questions = useMemo(() => steps.map((s) => s.question), [steps]);
  const [step, setStep] = useState<Step>('brief');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const shown =
    step === 'brief' ? 0 : step === 'turns' ? (steps[index]?.shown ?? lines.length) : lines.length;

  /** Bumped on every play so a queue of lines stops when something else is played. */
  const playToken = useRef(0);
  /** Lines already on screen at the last render (their autoplay has started). */
  const played = useRef(0);

  useEffect(() => onShown(shown), [shown]);

  const play = (index: number, slow: boolean) => {
    const line = lines[index];
    if (!line) return Promise.resolve();
    playToken.current++;
    return playAudio(lineAudioId(unit.id, line.id), {
      speed: slow ? 'slow' : 'normal',
      text: line.en,
    });
  };

  // Play the NPC lines that just appeared, in order. The learner's own line was
  // already heard when they checked it, so it is not played again.
  useEffect(() => {
    const fresh: number[] = [];
    for (let i = played.current; i < shown; i++) if (lines[i]?.speaker === 'npc') fresh.push(i);
    played.current = shown;
    if (fresh.length === 0) return;
    void (async () => {
      for (const index of fresh) {
        const token = playToken.current + 1;
        await play(index, false);
        if (playToken.current !== token) return;
      }
    })();
  }, [shown]);
  useEffect(
    () => () => {
      playToken.current++;
      stopAudio();
    },
    [],
  );

  // Enter is 開始 on the brief and 看結果 at the end, where 0 is 中文 on/off; during the turns
  // the questions own the keys.
  useKeys(
    {
      Enter: () => {
        if (step === 'brief') setStep('turns');
        else if (step === 'end') onFinish(results);
      },
      '0': () => {
        if (step === 'end') settingsStore.set({ showZh: !settingsStore.get().showZh });
      },
    },
    step !== 'turns',
  );

  if (step === 'brief') {
    return (
      <div class="intro" data-testid="roleplay-brief">
        <p class="flow-heading">換你上場</p>
        <p>這次沒有劇本，你要自己完成整段對話。</p>
        <p class="flow-note">
          輪到你的時候，看前面的對話，把單字排成你要說的話。你要說 {turns.length} 句。
        </p>
        <p class="flow-note">打開「跟我說」，每句排完再大聲說一次（不計分）。</p>
        <div class="flow-actions">
          <button
            class="pixel-button small"
            onClick={() => setSpeak(!speak)}
            aria-pressed={speak}
            data-testid="roleplay-speak"
          >
            跟我說：{speak ? '開' : '關'}
          </button>
          <button
            class="pixel-button primary"
            onClick={() => setStep('turns')}
            data-testid="roleplay-start"
          >
            開始
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    );
  }

  const chat = <ChatLines lines={lines.slice(0, shown)} current={shown - 1} onPlay={play} />;
  if (step === 'turns') {
    return (
      <div class="roleplay" data-testid="roleplay">
        {chat}
        <QuestionRunner
          questions={questions}
          showHearts
          onProgress={setIndex}
          onFinish={(done) => {
            setResults(done);
            setStep('end');
          }}
        />
      </div>
    );
  }
  return (
    <div class="story" data-testid="roleplay-end">
      <p class="flow-heading">你完成了整段對話！</p>
      {chat}
      <div class="flow-actions">
        <ZhToggle hint />
        <button
          class="pixel-button primary"
          onClick={() => onFinish(results)}
          data-testid="roleplay-done"
        >
          看結果
          <KeyCap k="Enter" />
        </button>
      </div>
    </div>
  );
}
