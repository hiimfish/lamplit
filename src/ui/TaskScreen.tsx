import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { getUnit, taskItemIds } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { makeRng, buildTaskPractice } from '../learning/questionGen';
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
import { QuestionView } from './minigames/QuestionView';
import { SceneStory } from './SceneStory';

const MAX_HEARTS = 3;
const hearts = (n: number) => '●'.repeat(n) + '○'.repeat(MAX_HEARTS - n);

interface RunnerProps {
  questions: Question[];
  /** Show hearts. A task is never failed: at 0 hearts they refill gently. */
  showHearts: boolean;
  onFinish: (results: AnswerResult[]) => void;
}

/**
 * Runs a list of questions: scheduling, save after every answer, progress, combo, hearts.
 * One runner is one practice session: each item is scheduled once, with its worst answer.
 */
export function QuestionRunner({ questions, showHearts, onFinish }: RunnerProps) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [combo, setCombo] = useState(0);
  const [heartsLeft, setHeartsLeft] = useState(MAX_HEARTS);
  const [refilled, setRefilled] = useState(false);
  const session = useRef<PracticeSession>(createSession());

  const question = questions[index];

  const onAnswer = (result: AnswerResult) => {
    if (!question) return;
    setRefilled(false);
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
      commitSave(applied.save);
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
          setRefilled(true);
        } else {
          setHeartsLeft(heartsLeft - 1);
        }
      }
    }
    if (index + 1 >= questions.length) onFinish(nextResults);
    else setIndex(index + 1);
  };

  if (!question) return null;
  return (
    <div class="practice" data-testid="practice">
      <div class="flow-bar">
        <span data-testid="progress-text">
          {index + 1} / {questions.length}
        </span>
        {combo >= 2 && <span class="combo">連擊 x{combo}</span>}
        {showHearts && (
          <span class="hearts" data-testid="hearts" aria-label={`剩 ${heartsLeft} 顆心`}>
            {hearts(heartsLeft)}
          </span>
        )}
      </div>
      <div class="progress" aria-hidden="true">
        <div class="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      {refilled && (
        <p class="gentle" data-testid="refill">
          沒關係，再聽一次，心已經補滿。
        </p>
      )}
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
  useEffect(() => playMusic('cafe'), []);

  // Items with no card yet are "new" in the result screen.
  const newItemIds = useMemo(() => {
    const save = appStore.get().save;
    return task ? taskItemIds(task).filter((id) => !(id in save.cards)) : [];
  }, [task]);
  const questions = useMemo(
    () => (unit && task ? buildTaskPractice(unit, task, makeRng(currentNow().getTime())) : []),
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

  return (
    <div class="flow" data-testid="task">
      <div class="flow-card">
        <div class="flow-title">{task.title}</div>
        {phase === 'story' && (
          <SceneStory unit={unit} task={task} onDone={() => setPhase('intro')} />
        )}
        {phase === 'intro' && <IntroCards task={task} onDone={() => setPhase('practice')} />}
        {phase === 'practice' && (
          <QuestionRunner questions={questions} showHearts onFinish={finish} />
        )}
        <button
          class="pixel-button small quit"
          onClick={() => appStore.set({ screen: 'town' })}
          data-testid="quit"
        >
          先回小鎮
        </button>
      </div>
    </div>
  );
}
