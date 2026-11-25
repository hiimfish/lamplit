/**
 * 開發測試: under 今天的目標 in the town, development only (DEV_TOOLS). A divider, then every
 * way to play as a key that always works: the screens (with the first place's content when
 * today has nothing for them) and each question kind on its own.
 */
import { playSfx } from '../../audio/sfx';
import { actName } from '../../content/titles';
import { appStore } from '../../core/appState';
import { t } from '../../core/i18n';
import type { AppState } from '../../core/appState';
import { DEV_KINDS, devKindLabel, devTasks } from './devPlay';
import './dev.css';

function open(patch: Partial<AppState>): void {
  playSfx('click');
  appStore.set({ result: undefined, devPlay: true, ...patch });
}

export function DevPlayRows() {
  const { story, rolePlay } = devTasks();
  // `id` (the Chinese name) keeps each key's data-testid the same in either language.
  const screens: { id: string; label: string; patch: Partial<AppState> }[] = [
    ...(story
      ? [
          {
            id: '劇情任務',
            label: t('劇情任務', 'Story'),
            patch: {
              screen: 'task' as const,
              activeTask: { unitId: story.unit.id, taskId: story.task.id },
            },
          },
        ]
      : []),
    ...(rolePlay
      ? [
          {
            id: '角色扮演',
            label: t('角色扮演', 'Role-play'),
            patch: {
              screen: 'task' as const,
              activeTask: { unitId: rolePlay.unit.id, taskId: rolePlay.task.id },
            },
          },
        ]
      : []),
    { id: '單字快練', label: t('單字快練', 'Word sprint'), patch: { screen: 'sprint' } },
    { id: '今日複習', label: t('今日複習', 'Daily review'), patch: { screen: 'review' } },
    { id: '聽力加量', label: t('聽力加量', 'Extra listening'), patch: { screen: 'listen' } },
    { id: '文法快練', label: t('文法快練', 'Grammar drill'), patch: { screen: 'grammar' } },
    { id: '進度', label: t('進度', 'Progress'), patch: { screen: 'progress' } },
    ...[1, 2, 3, 4].map((act) => ({
      id: `第${act}幕結業考`,
      label: t(`第${act}幕結業考`, `${actName(act)} final exam`),
      patch: { screen: 'exam' as const, activeExam: act },
    })),
    ...[1, 2, 3].map((act) => ({
      id: `第${act}幕跳級考`,
      label: t(`第${act}幕跳級考`, `${actName(act)} skip test`),
      patch: { screen: 'skip' as const, activeSkip: act },
    })),
  ];

  return (
    <div class="dev-play" data-testid="dev-play">
      <p class="dev-play-title">{t('開發測試（只在開發時出現）', 'Dev test (dev server only)')}</p>
      <p class="dev-play-sub">{t('玩法', 'Ways to play')}</p>
      <div class="dev-play-keys">
        {screens.map(({ id, label, patch }) => (
          <button
            key={id}
            type="button"
            class="pixel-button small"
            onClick={() => open(patch)}
            data-testid={`dev-${id}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p class="dev-play-sub">{t('題型（每種 3 題）', 'Question kinds (3 each)')}</p>
      <div class="dev-play-keys">
        {DEV_KINDS.map((devKind) => (
          <button
            key={devKind.key}
            type="button"
            class="pixel-button small"
            onClick={() => open({ screen: 'devquiz', devKind: devKind.key })}
            data-testid={`dev-kind-${devKind.key}`}
          >
            {devKindLabel(devKind)}
          </button>
        ))}
      </div>
    </div>
  );
}
