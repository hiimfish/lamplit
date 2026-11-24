import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { nowPlaying } from '../audio/pronounce';
import { playSfx } from '../audio/sfx';
import { UNITS, getUnit, speakerOf, taskItemIds } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { useStore } from '../core/store';
import { logAnswer } from '../learning/mistakes';
import { makeRng, buildTaskPractice } from '../learning/questionGen';
import { isHeard } from '../learning/heardQuestion';
import type { AnswerResult, Question } from '../learning/questions';
import {
  applySessionAnswer,
  createSession,
  finishTask,
  taskKey,
  type PracticeSession,
} from '../learning/sessionPlan';
import './flow.css';
import { IntroCards } from './IntroCards';
import { QuitKey } from './QuitKey';
import { QuestionView } from './minigames/QuestionView';
import { RolePlay } from './RolePlay';
import { SceneStory } from './SceneStory';
import { stageFrame, TaskStage } from './stage/SceneStage';
import { stageAfter, stageAt } from './stage/stageState';

const MAX_HEARTS = 3;
const hearts = (n: number) => '●'.repeat(n) + '○'.repeat(MAX_HEARTS - n);

interface RunnerProps {
  questions: Question[];
  /** Show hearts. A task is never failed: at 0 hearts they refill gently. */
  showHearts: boolean;
  onFinish: (results: AnswerResult[]) => void;
  /** Told the index of the next question each time the runner moves on. */
  onProgress?: (index: number) => void;
}

/**
 * Runs a list of questions: scheduling, save after every answer, progress, combo, hearts.
 * One runner is one practice session: each item is scheduled once, with its worst answer.
 */
export function QuestionRunner({ questions, showHearts, onFinish, onProgress }: RunnerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [combo, setCombo] = useState(0);
  const [heartsLeft, setHeartsLeft] = useState(MAX_HEARTS);
  /** The gentle note after the hearts refill, or undefined. */
  const [refilled, setRefilled] = useState<string | undefined>(undefined);
  const session = useRef<PracticeSession>(createSession());

  const question = questions[index];

  const onAnswer = (result: AnswerResult) => {
    if (!question) return;
    setRefilled(undefined);
    let nextResults = results;
    if (question.kind !== 'speak') {
      // Speak questions are never graded and never used for scheduling.
      const applied = applySessionAnswer(
        appStore.get().save,
        session.current,
        result,
        currentNow(),
        question.kind,
      );
      session.current = applied.session;
      commitSave(logAnswer(applied.save, question, result, currentNow()));
      nextResults = [...results, result];
      setResults(nextResults);
      if (result.correct) {
        playSfx('correct', combo);
        setCombo(combo + 1);
      } else {
        playSfx('wrong');
        setCombo(0);
        if (heartsLeft <= 1) {
          setHeartsLeft(MAX_HEARTS);
          // A question read on screen (文法快練, signs, passages) has nothing to hear again.
          setRefilled(isHeard(question) ? '沒關係，再聽一次' : '沒關係，再想一次');
        } else {
          setHeartsLeft(heartsLeft - 1);
        }
      }
    }
    if (index + 1 >= questions.length) {
      onFinish(nextResults);
    } else {
      setIndex(index + 1);
      onProgress?.(index + 1);
    }
  };

  if (!question) return null;
  return (
    <div class="practice" data-testid="practice">
      <div class="flow-bar">
        <span data-testid="progress-text">
          {index + 1} / {questions.length}
        </span>
        {/* A refill follows a wrong answer, so it never shows together with a combo. */}
        {refilled ? (
          <span class="gentle" data-testid="refill">
            {refilled}
          </span>
        ) : (
          combo >= 2 && <span class="combo">連擊 x{combo}</span>
        )}
        {showHearts && (
          <span class="hearts" data-testid="hearts" aria-label={`剩 ${heartsLeft} 顆心`}>
            {hearts(heartsLeft)}
          </span>
        )}
      </div>
      <div class="progress" aria-hidden="true">
        <div class="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <QuestionView question={question} onAnswer={onAnswer} />
    </div>
  );
}

type Phase = 'story' | 'intro' | 'practice';

export function TaskScreen() {
  const active = appStore.get().activeTask;
  const unit = active ? getUnit(active.unitId) : undefined;
  const task = unit?.tasks.find((t) => t.id === active?.taskId);

  const [phase, setPhase] = useState<Phase>('story');
  /** Story: how many scene lines are on screen. */
  const [storyShown, setStoryShown] = useState(1);
  /** Role-play: how many scene lines are on screen. */
  const [rolePlayShown, setRolePlayShown] = useState(0);
  const { audioId: heard } = useStore(nowPlaying);
  useEffect(() => playMusic('cafe'), []);

  // Items with no card yet are "new" in the result screen.
  const newItemIds = useMemo(() => {
    const save = appStore.get().save;
    return task ? taskItemIds(task).filter((id) => !(id in save.cards)) : [];
  }, [task]);
  const questions = useMemo(
    () =>
      unit && task && task.kind !== 'roleplay'
        ? buildTaskPractice(unit, task, makeRng(currentNow().getTime()), UNITS)
        : [],
    [unit, task],
  );

  if (!unit || !task) {
    return (
      <div class="flow">
        <div class="flow-card">
          <p>找不到這個任務。</p>
          <button class="pixel-button" onClick={() => appStore.set({ screen: 'town' })}>
            回小鎮
          </button>
        </div>
      </div>
    );
  }

  const finish = (results: AnswerResult[]) => {
    const { save, outcome } = finishTask(
      appStore.get().save,
      taskKey(unit.id, task.id),
      results,
      currentNow(),
      newItemIds,
    );
    commitSave(save);
    playSfx(outcome.stars >= 2 ? 'complete' : 'coin');
    appStore.set({
      screen: 'result',
      result: { kind: 'task', unitId: unit.id, taskId: task.id, outcome, coins: outcome.coins },
    });
  };

  // Units with a stage show it for the whole task: the story (or a role-play)
  // builds its scene on the stage line by line, then it rests at the story's end
  // during the intro cards and practice. In every phase whoever is heard in the
  // clip playing right now bobs.
  const frame = stageFrame(unit.id);
  const rolePlay = task.kind === 'roleplay';
  const inStory = !rolePlay && phase === 'story';
  const talking = heard ? speakerOf(heard) : undefined;
  const shown = rolePlay ? rolePlayShown : inStory ? storyShown : task.scene.length;
  const view = rolePlay || inStory ? stageAt(task.scene, shown) : stageAfter(task.scene);
  return (
    <div class={`flow${frame ? ' has-stage' : ''}`} data-testid="task">
      {frame && (
        <TaskStage
          frame={frame}
          unit={unit}
          scene={task.scene}
          backdrop={task.backdrop}
          view={view}
          beat={shown}
          talking={talking}
        />
      )}
      <div class="flow-card">
        <div class="flow-title">{task.title}</div>
        {rolePlay && (
          <RolePlay unit={unit} task={task} onShown={setRolePlayShown} onFinish={finish} />
        )}
        {inStory && (
          <SceneStory
            unit={unit}
            task={task}
            onDone={() => setPhase('intro')}
            onShown={setStoryShown}
          />
        )}
        {!rolePlay && phase === 'intro' && (
          <IntroCards task={task} onDone={() => setPhase('practice')} />
        )}
        {!rolePlay && phase === 'practice' && (
          <QuestionRunner questions={questions} showHearts onFinish={finish} />
        )}
        <QuitKey label="先回小鎮" onLeave={() => appStore.set({ screen: 'town' })} testId="quit" />
      </div>
    </div>
  );
}
