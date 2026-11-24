import { useEffect, useMemo, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import type { Unit, Word } from '../content/types';
import { UNITS } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { buildSprintQuestions, makeRng } from '../learning/questionGen';
import type { AnswerResult } from '../learning/questions';
import { addCoins, buildDailyReview, reviewCoins, starsForAccuracy } from '../learning/sessionPlan';
import { finishSprint, reviewLimit, sprintPlan, sprintWindow } from '../learning/sprint';
import './flow.css';
import { IntroCards } from './IntroCards';
import { QuestionRunner } from './TaskScreen';
import { TOWN } from './TownScreen';
import { SPRINT_NOTE } from './GoalRows';
import { QuitKey } from './QuitKey';

/** Where each word lives, so its audio and its place's words can be found. */
function wordHome(): Map<string, { unit: Unit; word: Word }> {
  const home = new Map<string, { unit: Unit; word: Word }>();
  for (const unit of UNITS) {
    for (const word of unit.words) if (!home.has(word.id)) home.set(word.id, { unit, word });
  }
  return home;
}

/** 單字快練: up to 10 new words, first as cards, then a listen-pick and a meaning question each. */
export function SprintScreen() {
  useEffect(() => playMusic('cafe'), []);
  const [phase, setPhase] = useState<'intro' | 'practice'>('intro');
  const round = useMemo(() => {
    const now = currentNow();
    const save = appStore.get().save;
    const due = buildDailyReview(save, now, reviewLimit(save.route)).length;
    const plan = sprintPlan(TOWN, save, now, due);
    const home = wordHome();
    const entries = plan.words.flatMap((id) => home.get(id.slice('word:'.length)) ?? []);
    // Wrong options: the words of the places being taught and every word already learned.
    const pool = [
      ...sprintWindow(TOWN, save).flatMap((unit) => unit.words),
      ...[...home.values()]
        .filter(({ word }) => `word:${word.id}` in save.cards)
        .map((e) => e.word),
    ];
    return {
      plan,
      itemIds: entries.map(({ word }) => `word:${word.id}`),
      questions: buildSprintQuestions(entries, pool, makeRng(now.getTime())),
    };
  }, []);

  const finish = (results: AnswerResult[]) => {
    const now = currentNow();
    const coins = reviewCoins(results);
    commitSave(addCoins(finishSprint(appStore.get().save, round.itemIds.length, now), coins));
    const correct = results.filter((r) => r.correct).length;
    playSfx('complete');
    appStore.set({
      screen: 'result',
      result: {
        kind: 'sprint',
        outcome: {
          stars: starsForAccuracy(results.length ? correct / results.length : 1),
          coins,
          correct,
          total: results.length,
          newItemIds: round.itemIds,
          improved: false,
        },
        coins,
      },
    });
  };

  const ready = round.plan.status === 'ready' && round.questions.length > 0;
  return (
    <div class="flow" data-testid="sprint-screen">
      <div class="flow-card">
        <div class="flow-title">單字快練</div>
        {!ready ? (
          <p data-testid="sprint-status">{SPRINT_NOTE[round.plan.status]}</p>
        ) : phase === 'intro' ? (
          <IntroCards itemIds={round.itemIds} onDone={() => setPhase('practice')} />
        ) : (
          <QuestionRunner questions={round.questions} showHearts={false} onFinish={finish} />
        )}
        <QuitKey
          label={ready ? '先回小鎮' : '回小鎮'}
          confirm={ready}
          onLeave={() => appStore.set({ screen: 'town' })}
        />
      </div>
    </div>
  );
}
