import { GRAMMAR_POINTS } from '../content/grammar';
import { getItem } from '../content/units';
import { appStore, currentNow } from '../core/appState';
import { useStore } from '../core/store';
import { labelOf, topMistakes, type MistakeBlock, type MistakeRow } from '../learning/mistakes';
import './mistakes.css';
import './progress.css';

/** Days looked back, and rows listed per block. */
const DAYS = 30;
const LISTED = 5;

/** 「f／v（fan／van）」 for `p:fan_van`, from the sound pair's focus and its two words. */
function pairLabel(tag: string): string | undefined {
  const info = getItem(`pair:${tag.slice(2)}`);
  if (!info || !info.sides || info.sides.length < 2) return undefined;
  const words = info.sides.map((s) => s.en).join('／');
  return info.focus ? `${info.focus}（${words}）` : words;
}

/** The Chinese name of a grammar point from `g:<id>`. */
function grammarLabel(tag: string): string | undefined {
  const id = tag.slice(2);
  return GRAMMAR_POINTS.find((g) => g.id === id)?.zh;
}

function nameOf(row: MistakeRow): string {
  const lookup = (tag: string) =>
    tag.startsWith('p:') ? pairLabel(tag) : tag.startsWith('g:') ? grammarLabel(tag) : undefined;
  return labelOf(row.tag, lookup) ?? row.tag.slice(2);
}

function Rows({ rows, testId }: { rows: MistakeRow[]; testId: string }) {
  const top = Math.max(1, ...rows.map((r) => r.missed));
  return (
    <ul class="progress-acts mistakes-list" data-testid={testId}>
      {rows.map((row) => (
        <li key={row.tag}>
          <span class="progress-act-name">{nameOf(row)}</span>
          <span class="progress-meter" aria-hidden="true">
            <span style={{ width: `${(row.missed / top) * 100}%` }} />
          </span>
          <span class="progress-act-count">
            {row.tag.startsWith('e:') ? `錯 ${row.missed} 次` : `錯 ${row.missed}／${row.asked}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Block({
  title,
  rows,
  empty,
  testId,
}: {
  title: string;
  rows: MistakeRow[];
  empty: string;
  testId: string;
}) {
  return (
    <div class="mistakes-block">
      <p class="flow-note mistakes-sub">{title}</p>
      {rows.length > 0 ? (
        <Rows rows={rows} testId={testId} />
      ) : (
        <p class="flow-note mistakes-empty" data-testid={testId}>
          {empty}
        </p>
      )}
    </div>
  );
}

/** 最常錯的音和文法 on the 進度 screen: ranked rows from `topMistakes`, not keys. */
export function MistakePanel() {
  const { save } = useStore(appStore);
  const now = currentNow();
  const top = (block: MistakeBlock) => topMistakes(save, now, DAYS, block, LISTED);
  const grammar = top('grammar');
  return (
    <section class="mistakes" aria-labelledby="mistakes-title" data-testid="mistakes">
      <p class="flow-heading" id="mistakes-title">
        最常錯的音和文法
      </p>
      <p class="flow-note">最近 30 天答錯的題目，最多各列 5 項。</p>
      {grammar.length > 0 && (
        <Block title="文法點" rows={grammar} empty="" testId="mistakes-points" />
      )}
      <Block
        title="聽不清楚的音"
        rows={top('sound')}
        empty="還沒有答錯的聽辨題。"
        testId="mistakes-sound"
      />
      <Block
        title="文法和拼字"
        rows={top('writing')}
        empty="還沒有答錯的紀錄。"
        testId="mistakes-grammar"
      />
      <Block
        title="聽力題型"
        rows={top('listening')}
        empty="還沒有答錯的紀錄。"
        testId="mistakes-listening"
      />
    </section>
  );
}
