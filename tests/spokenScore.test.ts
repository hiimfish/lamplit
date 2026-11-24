import { describe, expect, it } from 'vitest';
import { SPOKEN_LEVEL_LABEL, scoreSpoken, spokenLevel } from '../src/learning/spokenScore';

const score = (target: string, ...heard: string[]) => scoreSpoken(target, heard)?.score;

describe('scoreSpoken: basics', () => {
  it('gives 100 for the same words', () => {
    expect(score('Where is the station?', 'where is the station')).toBe(100);
  });

  it('returns null when nothing was heard', () => {
    expect(scoreSpoken('Hello there.', [])).toBeNull();
    expect(scoreSpoken('Hello there.', ['', '   '])).toBeNull();
    expect(scoreSpoken('Hello there.', ['...'])).toBeNull();
  });

  it('returns null when the target has no words', () => {
    expect(scoreSpoken('...', ['hello'])).toBeNull();
    expect(scoreSpoken('', ['hello'])).toBeNull();
  });

  it('gives 0 for unrelated words', () => {
    expect(score('Where is the station?', 'banana pudding tomorrow')).toBe(0);
  });

  it('does not punish extra words', () => {
    expect(score('Two coffees, please.', 'well um two coffees please thank you')).toBe(100);
  });

  it('ignores case, accents and punctuation', () => {
    expect(score('Café, please!', 'CAFE PLEASE')).toBe(100);
  });

  it('survives special characters and emoji', () => {
    expect(score('Hello 😀 world', 'hello world')).toBe(100);
  });
});

describe('scoreSpoken: order', () => {
  it('counts only words in order (plan example: 83)', () => {
    expect(score("I'll have it to go.", 'I will have to go it')).toBe(83);
  });

  it('a fully reversed sentence scores low', () => {
    expect(score('one two three four', 'four three two one')).toBeLessThan(40);
  });
});

describe('scoreSpoken: near matches', () => {
  it('counts a near word for half', () => {
    // 3 hits + 1 near of 4 words: 3.5 / 4
    expect(score('please bring the menu', 'please bring the menus')).toBe(88);
  });

  it('counts a same-stem word as near', () => {
    expect(score('she walked home', 'she walk home')).toBe(83);
  });

  it('counts a homophone as near', () => {
    expect(score('I read it too', 'I read it to')).toBe(88);
  });

  it('does not treat short different words as near', () => {
    expect(score('cat', 'cut')).toBe(0);
  });

  it('allows two edits only on long words', () => {
    expect(score('appointment', 'apointmant')).toBe(50);
    expect(score('hotel', 'hostel')).toBe(50);
    expect(score('hotel', 'mostly')).toBe(0);
  });

  it('marks hit, near and missed words', () => {
    const result = scoreSpoken('please bring the menu', ['please bring menus']);
    expect(result?.marks.map((m) => [m.word, m.status])).toEqual([
      ['please', 'hit'],
      ['bring', 'hit'],
      ['the', 'missed'],
      ['menu', 'near'],
    ]);
  });
});

describe('scoreSpoken: canonical forms', () => {
  it('matches a contraction with its long form', () => {
    expect(score("I'm sorry, I don't know", 'I am sorry I do not know')).toBe(100);
    expect(score("She can't come", 'she cannot come')).toBe(100);
    expect(score("We won't be late", 'we will not be late')).toBe(100);
    expect(score("It's open", 'it is open')).toBe(100);
  });

  it('drops an unknown possessive s', () => {
    expect(score("Tom's bag", 'tom bag')).toBe(100);
  });

  it('matches $4,000 with four thousand dollars', () => {
    expect(score('It costs $4,000.', 'it costs four thousand dollars')).toBe(100);
    expect(score('It costs four thousand dollars.', 'it costs 4000 dollars')).toBe(100);
  });

  it('turns percent signs into words', () => {
    expect(score('Take 20% off.', 'take twenty percent off')).toBe(100);
  });

  it('matches ordinals', () => {
    expect(score('The 10th floor', 'the tenth floor')).toBe(100);
    expect(score('On the 3rd of May', 'on the third of may')).toBe(100);
  });

  it('turns number words into digits', () => {
    expect(score('Meet at nine thirty.', 'meet at 9 30')).toBe(100);
    expect(score('There are twenty-one seats.', 'there are 21 seats')).toBe(100);
    expect(score('Room two hundred five', 'room 205')).toBe(100);
  });

  it('keeps "ten thirty" as two numbers', () => {
    expect(score('ten thirty', '10 30')).toBe(100);
  });

  it('is not fooled by nearly equal numbers', () => {
    expect(score('room 4001', 'room 4000')).toBe(50);
    expect(score('thirteen', 'thirty')).toBe(0);
  });

  it('matches titles', () => {
    expect(score('Mister Lee, please', 'mr lee please')).toBe(100);
    expect(score('Mrs. Lee is here', 'miss lee is here')).toBe(100);
  });
});

describe('scoreSpoken: names', () => {
  it('does not penalise a missed name', () => {
    expect(score('Please call Ms. Carter.', 'please call ms')).toBe(100);
    expect(score('I met Tom yesterday', 'i met yesterday')).toBe(100);
  });

  it('does not penalise a name heard wrongly (Ms. Carter / miss carton)', () => {
    const result = scoreSpoken('Ms. Carter', ['miss carton']);
    expect(result?.score).toBe(100);
    expect(result?.marks.map((m) => [m.word, m.status, m.free ?? false])).toEqual([
      ['Ms', 'hit', false],
      ['Carter', 'missed', true],
    ]);
  });

  it('counts a name heard nearly in full', () => {
    const result = scoreSpoken('Ask Ms. Carter now', ['ask miss carter now']);
    expect(result?.score).toBe(100);
    const near = scoreSpoken('Ask Ms. Carter now', ['ask miss carters now']);
    expect(near?.score).toBe(100);
    expect(near?.marks[2]).toEqual({ word: 'Carter', status: 'near', free: true });
  });

  it('marks a missed name as free and missed', () => {
    const result = scoreSpoken('Please call Ms. Carter.', ['please call ms']);
    expect(result?.marks.at(-1)).toMatchObject({ word: 'Carter', status: 'missed', free: true });
  });

  it('counts a name that was heard', () => {
    expect(score('Call Tom now', 'call tom now')).toBe(100);
  });

  it('does not treat the first word, I or days and months as names', () => {
    expect(score('Monday is good', 'is good')).toBe(67);
    expect(score('Where is it', 'is it')).toBe(67);
    expect(score('Then I left in May', 'then left in may')).toBe(80);
  });

  it('an all-name target with nothing matched scores 0', () => {
    expect(score('Hello Tom', 'xyz')).toBe(0);
  });
});

describe('scoreSpoken: alternatives', () => {
  it('takes the best of the alternatives', () => {
    const result = scoreSpoken('Where is the station', [
      'where is the nation',
      'where is the station',
      'wear is a stay',
    ]);
    expect(result?.score).toBe(100);
  });

  it('skips empty alternatives', () => {
    expect(score('hello there', '', 'hello there')).toBe(100);
  });

  it('keeps the marks of the best alternative', () => {
    const result = scoreSpoken('good morning', ['bad evening', 'good morning']);
    expect(result?.marks.map((m) => m.status)).toEqual(['hit', 'hit']);
  });
});

describe('scoreSpoken: bands', () => {
  // n of 100 words matched, in order, so the score is exactly n
  const words = Array.from({ length: 100 }, (_, i) => `item${i}`);
  const target = words.join(' ');
  const heard = (n: number) => words.slice(0, n).join(' ');

  it('puts the boundaries in the right band', () => {
    const cases: [number, string][] = [
      [39, 'unclear'],
      [40, 'partly'],
      [69, 'partly'],
      [70, 'mostly'],
      [89, 'mostly'],
      [90, 'clear'],
      [100, 'clear'],
    ];
    for (const [n, level] of cases) {
      const result = scoreSpoken(target, [heard(n)]);
      expect(result?.score).toBe(n);
      expect(result?.level).toBe(level);
      expect(spokenLevel(n)).toBe(level);
    }
  });

  it('has a zh-TW label for each level', () => {
    expect(SPOKEN_LEVEL_LABEL).toEqual({
      clear: '很清楚',
      mostly: '大致聽得出來',
      partly: '聽到一部分',
      unclear: '這次沒聽清楚',
    });
  });
});
