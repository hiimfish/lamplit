/**
 * Menu-type screens (進度, results, 今日複習, quick drills, exams, 設定) take the whole
 * phone screen: while one is mounted the root carries data-full, and in portrait styles.css
 * hides the street (#game) and town.css the town's scene, so #ui runs from top to bottom.
 * Screens with a story or a task keep the street. Counted, so two holders (a screen and the
 * settings page over it) can come and go in any order.
 */
import { useEffect } from 'preact/hooks';

let holders = 0;

export function useFullScreen(on = true): void {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    holders += 1;
    root.dataset.full = '';
    return () => {
      holders -= 1;
      if (holders === 0) delete root.dataset.full;
    };
  }, [on]);
}
