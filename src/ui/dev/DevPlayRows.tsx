/**
 * 開發測試: under 今天的目標 in the town, development only (DEV_TOOLS). A divider, then every
 * way to play as a key that always works: the screens (with the first place's content when
 * today has nothing for them) and each question kind on its own.
 */
import { playSfx } from '../../audio/sfx';
import { appStore } from '../../core/appState';
import type { AppState } from '../../core/appState';
import { DEV_KINDS, devTasks } from './devPlay';
import './dev.css';

function open(patch: Partial<AppState>): void {
  playSfx('click');
  appStore.set({ result: undefined, devPlay: true, ...patch });
}

export function DevPlayRows() {
  const { story, rolePlay } = devTasks();
  const screens: { label: string; patch: Partial<AppState> }[] = [
    ...(story
      ? [
          {
            label: '劇情任務',
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
            label: '角色扮演',
            patch: {
              screen: 'task' as const,
              activeTask: { unitId: rolePlay.unit.id, taskId: rolePlay.task.id },
            },
          },
        ]
      : []),
    { label: '單字快練', patch: { screen: 'sprint' } },
    { label: '今日複習', patch: { screen: 'review' } },
    { label: '聽力加量', patch: { screen: 'listen' } },
    { label: '文法快練', patch: { screen: 'grammar' } },
    { label: '進度', patch: { screen: 'progress' } },
    ...[1, 2, 3, 4].map((act) => ({
      label: `第${act}幕結業考`,
      patch: { screen: 'exam' as const, activeExam: act },
    })),
    ...[1, 2, 3].map((act) => ({
      label: `第${act}幕跳級考`,
      patch: { screen: 'skip' as const, activeSkip: act },
    })),
  ];

  return (
    <div class="dev-play" data-testid="dev-play">
      <p class="dev-play-title">開發測試（只在開發時出現）</p>
      <p class="dev-play-sub">玩法</p>
      <div class="dev-play-keys">
        {screens.map(({ label, patch }) => (
          <button
            key={label}
            type="button"
            class="pixel-button small"
            onClick={() => open(patch)}
            data-testid={`dev-${label}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p class="dev-play-sub">題型（每種 3 題）</p>
      <div class="dev-play-keys">
        {DEV_KINDS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            class="pixel-button small"
            onClick={() => open({ screen: 'devquiz', devKind: key })}
            data-testid={`dev-kind-${key}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
