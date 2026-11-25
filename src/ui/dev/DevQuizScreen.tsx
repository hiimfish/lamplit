/**
 * 開發測試's question kinds: three real questions of one kind (devPlay.ts), played with the
 * task runner, then back to the town. Development only.
 */
import { useMemo } from 'preact/hooks';
import { appStore } from '../../core/appState';
import { QuitKey } from '../QuitKey';
import { QuestionRunner } from '../TaskScreen';
import { DEV_KINDS, devSamples } from './devPlay';
import '../flow.css';

export function DevQuizScreen() {
  const key = appStore.get().devKind;
  const label = DEV_KINDS.find((k) => k.key === key)?.label ?? key;
  const questions = useMemo(() => devSamples(key), [key]);
  const back = () => appStore.set({ screen: 'town' });
  return (
    <div class="flow" data-testid="devquiz-screen">
      <div class="flow-card">
        <div class="flow-title">開發測試：{label}</div>
        {questions.length === 0 ? (
          <p>內容裡找不到這種題型。</p>
        ) : (
          <QuestionRunner questions={questions} showHearts onFinish={back} />
        )}
        <QuitKey label="先回小鎮" confirm={false} onLeave={back} testId="quit" />
      </div>
    </div>
  );
}
