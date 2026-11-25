import { useEffect, useRef } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { GRAMMAR_BANK } from '../content/grammarBank';
import { appStore, commitSave, currentNow } from '../core/appState';
import { dateKey, type SaveData } from '../core/save';
import { buildDrill, finishDrill, grammarGoal } from '../learning/grammarDrill';
import { drillPointsToday } from '../learning/grammarOn';
import type { AnswerResult, Question } from '../learning/questions';
import { reviewCoins, starsForAccuracy } from '../learning/sessionPlan';
import { t } from '../core/i18n';
import './flow.css';
import './grammarDrill.css';
import { KeyCap } from './KeyCap';
import { useKeys } from './keys';
import { QuitKey } from './QuitKey';
import { QuestionRunner } from './TaskScreen';
import { TOWN } from './TownScreen';
import { devFallback, devGrammarPoints } from './dev/devPlay';

/** Wrong answers logged on `g:` tags so far today (the runner logs each answer itself). */
function grammarMisses(save: SaveData): number {
  let missed = 0;
  for (const [tag, count] of Object.entries(save.mistakes[dateKey(currentNow())] ?? {})) {
    if (tag.startsWith('g:')) missed += count[0];
  }
  return missed;
}

function buildRound(): Question[] {
  const now = currentNow();
  const save = appStore.get().save;
  const points = drillPointsToday(save, now, TOWN);
  return buildDrill(
    points.length === 0 && devFallback() ? devGrammarPoints() : points,
    GRAMMAR_BANK,
    save.grammarSeen,
    now.getTime(),
    grammarGoal(save.route),
  );
}

function EmptyCard() {
  const back = () => appStore.set({ screen: 'town' });
  useKeys({ Enter: back, Back: back });
  return (
    <div class="flow" data-testid="grammar-screen">
      <div class="flow-card">
        <div class="flow-title">{t('文法快練', 'Grammar drill')}</div>
        <p data-testid="grammar-empty">
          {t(
            '文法快練還沒有可以出的題目。多玩幾個任務再來。',
            'No grammar questions yet. Play a few more tasks first.',
          )}
        </p>
        <button type="button" class="pixel-button primary" onClick={back}>
          {t('回小鎮', 'Back to town')}
          <KeyCap k="Enter" />
        </button>
      </div>
    </div>
  );
}

/** 文法快練: a round of grammar bank questions, answered with feedback, paying coins at the end. */
export function GrammarDrillScreen() {
  useEffect(() => playMusic('cafe'), []);
  const round = useRef<{ questions: Question[]; missesAtStart: number } | null>(null);
  if (!round.current) {
    round.current = {
      questions: buildRound(),
      missesAtStart: grammarMisses(appStore.get().save),
    };
  }
  const { questions, missesAtStart } = round.current;
  const answered = useRef(0);
  const finished = useRef(false);

  const finish = (total: number, correct: number) => {
    if (finished.current) return;
    finished.current = true;
    commitSave(finishDrill(appStore.get().save, total, currentNow(), correct));
    const coins = reviewCoins(
      Array.from({ length: correct }, () => ({
        itemId: '',
        correct: true,
        usedHelp: false,
        ms: 0,
      })),
    );
    playSfx('complete');
    appStore.set({
      screen: 'result',
      result: {
        kind: 'grammar',
        outcome: {
          stars: starsForAccuracy(total ? correct / total : 1),
          coins,
          correct,
          total,
          newItemIds: [],
          improved: false,
        },
        coins,
      },
    });
  };

  const onFinish = (results: AnswerResult[]) =>
    finish(results.length, results.filter((r) => r.correct).length);

  const leave = () => {
    const n = answered.current;
    if (n <= 0) {
      appStore.set({ screen: 'town' });
      return;
    }
    const wrong = Math.min(n, Math.max(0, grammarMisses(appStore.get().save) - missesAtStart));
    finish(n, n - wrong);
  };

  if (questions.length === 0) return <EmptyCard />;
  return (
    <div class="flow" data-testid="grammar-screen">
      <div class="flow-card">
        <div class="flow-title">{t('文法快練', 'Grammar drill')}</div>
        <QuestionRunner
          questions={questions}
          showHearts={false}
          onFinish={onFinish}
          onProgress={(i) => {
            answered.current = i;
          }}
        />
        <QuitKey label={t('先收工', 'Finish for now')} confirm onLeave={leave} />
      </div>
    </div>
  );
}
