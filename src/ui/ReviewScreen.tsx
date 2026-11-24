import { useEffect, useMemo } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { getItem, getUnit } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { buildReviewQuestions, makeRng } from '../learning/questionGen';
import type { AnswerResult, Question } from '../learning/questions';
import { addCoins, buildDailyReview, reviewCoins, starsForAccuracy } from '../learning/sessionPlan';
import { finishReview, reviewLimit } from '../learning/sprint';
import './flow.css';
import { QuestionRunner } from './TaskScreen';
import { QuitKey } from './QuitKey';

/** `reviews(id)`: how often the item was reviewed, so a word is asked a different way each time. */
function buildQuestions(
  ids: string[],
  seed: number,
  reviews: (itemId: string) => number,
): Question[] {
  const rng = makeRng(seed);
  const byUnit = new Map<string, string[]>();
  for (const id of ids) {
    const unitId = getItem(id)?.unitId;
    if (unitId) byUnit.set(unitId, [...(byUnit.get(unitId) ?? []), id]);
  }
  const questions: Question[] = [];
  for (const [unitId, unitIds] of byUnit) {
    const unit = getUnit(unitId);
    if (unit) questions.push(...buildReviewQuestions(unit, unitIds, rng, reviews));
  }
  return questions;
}

/** Today's due items (up to 20, or 200 on the sprint route), ending in the shared result screen. */
export function ReviewScreen() {
  useEffect(() => playMusic('cafe'), []);
  const questions = useMemo(() => {
    const now = currentNow();
    const save = appStore.get().save;
    return buildQuestions(
      buildDailyReview(save, now, reviewLimit(save.route)),
      now.getTime(),
      (id) => save.cards[id]?.reps ?? 0,
    );
  }, []);

  const finish = (results: AnswerResult[]) => {
    const coins = reviewCoins(results);
    commitSave(addCoins(finishReview(appStore.get().save, results.length, currentNow()), coins));
    const correct = results.filter((r) => r.correct).length;
    playSfx('complete');
    appStore.set({
      screen: 'result',
      result: {
        kind: 'review',
        outcome: {
          stars: starsForAccuracy(results.length ? correct / results.length : 1),
          coins,
          correct,
          total: results.length,
          newItemIds: [],
          improved: false,
        },
        coins,
      },
    });
  };

  return (
    <div class="flow" data-testid="review-screen">
      <div class="flow-card">
        <div class="flow-title">今日複習</div>
        {questions.length === 0 ? (
          <p>今天沒有要複習的。</p>
        ) : (
          <QuestionRunner questions={questions} showHearts={false} onFinish={finish} />
        )}
        <QuitKey
          label="先回小鎮"
          confirm={questions.length > 0}
          onLeave={() => appStore.set({ screen: 'town' })}
        />
      </div>
    </div>
  );
}
