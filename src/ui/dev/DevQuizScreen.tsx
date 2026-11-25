/**
 * 開發測試's question kinds: three real questions of one kind (devPlay.ts), played with the
 * task runner, then back to the town. Development only.
 */
import { useMemo } from 'preact/hooks';
import { appStore } from '../../core/appState';
import { t } from '../../core/i18n';
import { QuitKey } from '../QuitKey';
import { QuestionRunner } from '../TaskScreen';
import { DEV_KINDS, devKindLabel, devSamples } from './devPlay';
import '../flow.css';

export function DevQuizScreen() {
  const key = appStore.get().devKind;
  const found = DEV_KINDS.find((k) => k.key === key);
  const label = found ? devKindLabel(found) : key;
  const questions = useMemo(() => devSamples(key), [key]);
  const back = () => appStore.set({ screen: 'town' });
  return (
    <div class="flow" data-testid="devquiz-screen">
      <div class="flow-card">
        <div class="flow-title">
          {t('開發測試：', 'Dev test: ')}
          {label}
        </div>
        {questions.length === 0 ? (
          <p>{t('內容裡找不到這種題型。', 'No questions of this kind in the content.')}</p>
        ) : (
          <QuestionRunner questions={questions} showHearts onFinish={back} />
        )}
        <QuitKey
          label={t('先回小鎮', 'Back to town')}
          confirm={false}
          onLeave={back}
          testId="quit"
        />
      </div>
    </div>
  );
}
