import { describe, expect, it } from 'vitest';
import {
  EXAM_IDS,
  EXAM_PLAN,
  examAct,
  sectionHasFile,
  writtenQuestionCount,
  type ExamForm,
  type ExamId,
  type SectionPlan,
} from '../src/content/exam';
import { examCopyKeys, validateExam } from '../src/content/validateExam';

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Builds a good section file for any section of the plan, with texts that never repeat. */
function goodFile(exam: ExamId, plan: SectionPlan): Obj {
  const act = examAct(exam);
  const sec = plan.id;
  const optionCount = act >= 2 ? 4 : 3;
  let uid = 0;
  let turn = 0;
  const next = () => ++uid;
  const filler = (n: number, tag: number) =>
    Array.from({ length: n }, (_, i) => `word${tag}x${i}`).join(' ');
  const choices = () => {
    const n = next();
    const answer = turn++ % optionCount;
    return {
      en: `What is question ${n}?`,
      zh: `問題${n}？`,
      options: Array.from({ length: optionCount }, (_, i) => `Option ${n} ${i}`),
      answer,
    };
  };
  const questions = (count: number) => Array.from({ length: count }, choices);

  const picture = (form: ExamForm) => {
    const n = next();
    const listen = act === 4;
    const count = listen ? 4 : optionCount;
    return {
      id: `${sec}_p${n}`,
      form,
      pictureId: 'picture_one',
      ...(listen ? { listen: true } : {}),
      options: Array.from({ length: count }, (_, i) => ({
        en: `Sentence ${n} ${i}.`,
        zh: `句子${n}${i}`,
      })),
      answer: turn++ % count,
    };
  };
  const respond = (form: ExamForm) => {
    const n = next();
    return {
      id: `${sec}_q${n}`,
      form,
      prompt: { role: 'clerk', en: `Can I ask thing ${n}?`, zh: `我可以問${n}嗎？` },
      responses: Array.from({ length: 3 }, (_, i) => ({
        en: `Reply ${n} ${i}.`,
        zh: `回答${n}${i}`,
      })),
      answer: turn++ % 3,
    };
  };
  const sign = (form: ExamForm) => {
    const n = next();
    return {
      id: `${sec}_s${n}`,
      form,
      heading: `Sign ${n}`,
      rows: [{ label: 'Open', value: `${n} a.m.` }],
      question: { en: `When does place ${n} open?`, zh: `${n} 幾點開？` },
      options: Array.from({ length: optionCount }, (_, i) => `At ${n}:${i}0`),
      answer: turn++ % optionCount,
    };
  };
  const fill = (form: ExamForm) => {
    const n = next();
    return {
      id: `${sec}_x${n}`,
      form,
      grammar: true,
      en: `Please ___ thing ${n} now.`,
      zh: `請現在做${n}。`,
      options: Array.from({ length: 4 }, (_, i) => `do${n}x${i}`),
      answer: turn++ % 4,
    };
  };
  const talk = (form: ExamForm, count: number) => {
    const n = next();
    const lineCount = act === 4 ? 8 : 4;
    return {
      id: `${sec}_t${n}`,
      form,
      lines: Array.from({ length: lineCount }, (_, i) => ({
        id: `${sec}_t${n}_${i}`,
        role: i % 2 === 0 ? 'clerk' : 'friend',
        en: `Line ${n} ${i}.`,
        zh: `第${n}${i}句`,
      })),
      questions: questions(count),
    };
  };
  const passage = (form: ExamForm, count: number) => {
    const n = next();
    const id = `${sec}_r${n}`;
    if (act === 4 && count >= 4) {
      const texts = count === 4 ? 2 : 3;
      return {
        id,
        form,
        texts: Array.from({ length: texts }, (_, t) => ({
          kind: 'notice',
          lines:
            texts === 2
              ? [filler(30, n * 10 + t), filler(30, n * 10 + t + 5), filler(30, n * 10 + t + 7)]
              : [filler(35, n * 10 + t), filler(35, n * 10 + t + 5)],
        })),
        questions: questions(count).map((q, i) => ({ ...q, ...(i < 2 ? { needs: [0, 1] } : {}) })),
      };
    }
    const lineWords = act === 4 ? 35 : 10;
    const lineCount = act === 4 ? 5 : 3;
    return {
      id,
      form,
      kind: 'notice',
      lines: Array.from({ length: lineCount }, (_, i) => filler(lineWords, n * 10 + i)),
      questions: questions(count),
    };
  };
  const textFill = (form: ExamForm, blanks: number) => {
    const n = next();
    const line = `Please ${Array.from({ length: blanks }, () => '___').join(' then ')} now ${n}.`;
    return {
      id: `${sec}_f${n}`,
      form,
      kind: 'notice',
      lines: [line],
      zh: [`請現在做${n}。`],
      blanks: Array.from({ length: blanks }, (_, i) => ({
        options: [`a${n}${i}`, `b${n}${i}`, `c${n}${i}`, `d${n}${i}`],
        answer: turn++ % 4,
      })),
    };
  };

  const file: Obj = { exam, section: sec };
  const w = plan.written;
  for (const form of ['A', 'B'] as const) {
    if (w.pictures) {
      file.pictures ??= [];
      for (let i = 0; i < w.pictures; i++) file.pictures.push(picture(form));
    }
    if (w.responds) {
      file.responds ??= [];
      for (let i = 0; i < w.responds; i++) file.responds.push(respond(form));
    }
    if (w.talks) {
      file.talks ??= [];
      for (const q of w.talks) file.talks.push(talk(form, q));
    }
    if (w.signs) {
      file.signs ??= [];
      for (let i = 0; i < w.signs; i++) file.signs.push(sign(form));
    }
    if (w.fills) {
      file.fills ??= [];
      for (let i = 0; i < w.fills; i++) file.fills.push(fill(form));
    }
    if (w.passages) {
      file.passages ??= [];
      for (const q of w.passages) file.passages.push(passage(form, q));
    }
    if (w.textFills) {
      file.textFills ??= [];
      for (const b of w.textFills) file.textFills.push(textFill(form, b));
    }
  }
  return file;
}

const sections = EXAM_IDS.flatMap((exam) =>
  EXAM_PLAN[exam].sections.filter(sectionHasFile).map((plan) => ({ exam, plan })),
);
const find = (exam: ExamId, id: string) => {
  const plan = EXAM_PLAN[exam].sections.find((s) => s.id === id)!;
  return goodFile(exam, plan);
};

describe('a good file for every section', () => {
  it('finds the 13 sections, each with a file and its total in the plan', () => {
    expect(sections).toHaveLength(13);
    for (const { plan } of sections) expect(writtenQuestionCount(plan.written)).toBe(plan.total);
  });
  it.each(sections.map(({ exam, plan }) => [`${exam}.${plan.id}`, exam, plan] as const))(
    '%s has no problems',
    (_name, exam, plan) => {
      expect(validateExam(goodFile(exam, plan))).toEqual([]);
    },
  );
});

describe('drafts', () => {
  it('accepts an empty draft', () => {
    expect(validateExam({ exam: 'exam3', section: 's2', draft: true })).toEqual([]);
  });
  it('accepts a draft with empty lists', () => {
    expect(validateExam({ exam: 'exam3', section: 's2', draft: true, talks: [] })).toEqual([]);
  });
  it('rejects a draft that has items', () => {
    const file = find('exam3', 's2');
    file.draft = true;
    expect(validateExam(file).join('\n')).toContain('is a draft');
  });
  it('rejects a draft flag that is not a boolean', () => {
    expect(validateExam({ exam: 'exam3', section: 's2', draft: 'yes' }).join('\n')).toContain(
      'draft must be true or false',
    );
  });
});

describe('who and what is checked', () => {
  const cases: [string, unknown, string][] = [
    ['null', null, 'not an object'],
    ['an array', [], 'not an object'],
    ['an unknown exam', { exam: 'exam9', section: 's1' }, 'unknown exam'],
    ['no exam', { section: 's1' }, 'unknown exam'],
    ['an unknown section', { exam: 'exam1', section: 's9' }, 'unknown section'],
    ['a section file with nothing in it', { exam: 'exam1', section: 's1' }, 'needs responds'],
  ];
  it.each(cases)('rejects %s', (_name, file, message) => {
    expect(validateExam(file).join('\n')).toContain(message);
  });
});

type Bad = [
  name: string,
  exam: ExamId,
  section: string,
  edit: (file: Obj) => void,
  message: string,
];

const bad: Bad[] = [
  ['an unknown top-level key', 'exam2', 's1', (f) => (f.extra = 1), 'unknown field "extra"'],
  ['responds in a reading section', 'exam2', 's2', (f) => (f.responds = []), 'does not have'],
  ['fills in a listening section', 'exam2', 's1', (f) => (f.fills = [{}]), 'does not have'],
  ['signs in Act 3', 'exam3', 's3', (f) => (f.signs = [{}]), 'does not have'],
  ['passages in a talk section', 'exam2', 's1', (f) => (f.passages = [{}]), 'does not have'],
  ['talks that are not a list', 'exam2', 's1', (f) => (f.talks = {}), 'talks must be a list'],
  ['a missing kind', 'exam2', 's1', (f) => delete f.talks, 'needs talks'],
  ['an item that is not an object', 'exam2', 's1', (f) => f.talks.push(5), 'must be an object'],
  // counts, per form
  [
    'a picture too few in form B',
    'exam1',
    's2',
    (f) => f.pictures.splice(-1, 1),
    'form B has 5 pictures',
  ],
  [
    'a picture too many in form A',
    'exam1',
    's2',
    (f) => f.pictures.push({ ...f.pictures[0], id: 's2_extra', form: 'A' }),
    'form A has 7 pictures',
  ],
  ['a talk too few', 'exam2', 's1', (f) => f.talks.splice(0, 1), 'form A talks have questions'],
  [
    'a question too few in a talk',
    'exam2',
    's1',
    (f) => f.talks[1].questions.pop(),
    'the plan wants [2,2,2,2,2]',
  ],
  [
    'talk questions in another order',
    'exam3',
    's1',
    (f) => {
      f.talks[0].questions.pop();
      f.talks[3].questions.push(f.talks[0].questions[0]);
    },
    'the plan wants',
  ],
  ['a passage too few', 'exam2', 's2', (f) => f.passages.splice(0, 1), 'passages have questions'],
  [
    'a blank count off',
    'exam3',
    's3',
    (f) => f.textFills[0].blanks.pop(),
    'textFills have questions',
  ],
  [
    'the same counts in only one form',
    'exam1',
    's2',
    (f) => f.pictures.forEach((p: Obj) => (p.form = 'A')),
    'form B has 0 pictures',
  ],
  ['a respond too few', 'exam1', 's1', (f) => f.responds.splice(0, 1), 'form A has 9 responds'],
  [
    'a fill too many',
    'exam3',
    's3',
    (f) => f.fills.push({ ...f.fills[0], id: 's3_extra' }),
    'form A has 13 fills',
  ],
  ['a sign too few', 'exam2', 's2', (f) => f.signs.pop(), 'form B has 1 signs'],
  // forms
  ['no form', 'exam1', 's2', (f) => delete f.pictures[0].form, 'needs form "A" or "B"'],
  ['a form C', 'exam1', 's2', (f) => (f.pictures[0].form = 'C'), 'needs form "A" or "B"'],
  // ids
  [
    'an id without the section prefix',
    'exam1',
    's2',
    (f) => (f.pictures[0].id = 'q1'),
    'must start with "s2_"',
  ],
  ['a capital in an id', 'exam1', 's2', (f) => (f.pictures[0].id = 's2_Q1'), 'must use only a-z'],
  ['a duplicate id', 'exam1', 's2', (f) => (f.pictures[1].id = f.pictures[0].id), 'used twice'],
  [
    'a line id without the prefix',
    'exam2',
    's1',
    (f) => (f.talks[0].lines[0].id = 'x1'),
    'must start with "s1_"',
  ],
  [
    'a line id used twice',
    'exam2',
    's1',
    (f) => (f.talks[1].lines[0].id = f.talks[0].lines[0].id),
    'used twice',
  ],
  [
    'a talk id that equals a line id',
    'exam2',
    's1',
    (f) => (f.talks[1].id = f.talks[0].lines[0].id),
    'used twice',
  ],
  // the existing checks, one item at a time
  ['once on a talk', 'exam3', 's1', (f) => (f.talks[0].once = true), 'once'],
  [
    'an unknown field in a talk',
    'exam3',
    's1',
    (f) => (f.talks[0].extra = 1),
    'unknown field "extra"',
  ],
  [
    'a talk line without Chinese',
    'exam2',
    's1',
    (f) => delete f.talks[0].lines[0].zh,
    'needs its Chinese',
  ],
  ['a bad role', 'exam2', 's1', (f) => (f.talks[0].lines[0].role = 'wizard'), 'bad role'],
  [
    'a passage that is too short',
    'exam2',
    's2',
    (f) => (f.passages[0].lines = ['One.', 'Two.']),
    'words',
  ],
  ['a picture with no answer', 'exam1', 's2', (f) => delete f.pictures[0].answer, 'bad answer'],
  [
    'a text fill with a bad blank count',
    'exam3',
    's3',
    (f) => (f.textFills[0].lines = ['No blank here.']),
    'blank',
  ],
  ['a listen picture before Act 4', 'exam1', 's2', (f) => (f.pictures[0].listen = true), 'Act 4'],
  // options
  ['two picture options', 'exam1', 's2', (f) => f.pictures[0].options.pop(), '(at least 3)'],
  [
    'three options in Act 3',
    'exam3',
    's1',
    (f) => {
      f.talks[0].questions[0].options.pop();
    },
    'exactly 4 from Act 2 on',
  ],
  [
    'three options in Act 2',
    'exam2',
    's2',
    (f) => f.signs[0].options.pop(),
    'exactly 4 from Act 2 on',
  ],
  [
    'five options in Act 1',
    'exam1',
    's1',
    (f) => f.talks[0].questions[0].options.push('Extra', 'More'),
    'options',
  ],
  [
    'four responses to a respond',
    'exam1',
    's1',
    (f) => f.responds[0].responses.push({ en: 'More.', zh: '更多' }),
    'exactly 3',
  ],
  [
    'a grammar fill with 3 options in Act 1',
    'exam1',
    's2',
    (f) => f.fills[0].options.pop(),
    'exactly 4 options',
  ],
  [
    'a sign of more than 15 words',
    'exam1',
    's2',
    (f) =>
      (f.signs[0].heading =
        'one two three four five six seven eight nine ten eleven twelve thirteen'),
    'max 15',
  ],
  [
    'a respond prompt said by the guide',
    'exam3',
    's1',
    (f) => (f.responds[0].prompt.role = 'guide'),
    'pick the role who asks',
  ],
  [
    'the same respond prompt twice',
    'exam2',
    's1',
    (f) => (f.responds[1].prompt.en = f.responds[0].prompt.en),
    'repeats',
  ],
  [
    'three options in Act 4 text fill',
    'exam4',
    's3',
    (f) => f.textFills[0].blanks[0].options.pop(),
    'options',
  ],
  [
    'five options in Act 3',
    'exam3',
    's4',
    (f) => f.passages[0].questions[0].options.push('Extra'),
    'options',
  ],
  // exam4 pictures
  [
    'an exam4 picture that is read',
    'exam4',
    's1',
    (f) => delete f.pictures[0].listen,
    'must be a sound-option picture',
  ],
  [
    'an exam4 picture with 3 sentences',
    'exam4',
    's1',
    (f) => f.pictures[0].options.pop(),
    'options',
  ],
  // copies
  [
    'the same question twice',
    'exam2',
    's1',
    (f) => (f.talks[1].questions[0].en = f.talks[0].questions[0].en),
    'repeats',
  ],
  [
    'the same question in forms A and B',
    'exam3',
    's4',
    (f) => (f.passages[4].questions[0].en = f.passages[0].questions[0].en),
    'repeats',
  ],
  [
    'the same right sentence under two pictures',
    'exam1',
    's2',
    (f) =>
      (f.pictures[1].options[f.pictures[1].answer].en =
        f.pictures[0].options[f.pictures[0].answer].en),
    'repeats',
  ],
  [
    'a long line said twice',
    'exam3',
    's1',
    (f) => {
      f.talks[0].lines[0].en = 'I will see you at noon today.';
      f.talks[1].lines[2].en = 'I will see you at noon today.';
    },
    'repeats',
  ],
  // answer positions
  [
    'every picture answer in the same place',
    'exam1',
    's2',
    (f) => f.pictures.forEach((p: Obj) => (p.answer = 0)),
    'answer A',
  ],
  [
    'most talk answers in the same place',
    'exam3',
    's1',
    (f) => f.talks.forEach((t: Obj) => t.questions.forEach((q: Obj) => (q.answer = 2))),
    'answer C',
  ],
];

describe('rejects broken content', () => {
  it.each(bad)('%s', (_name, exam, section, edit, message) => {
    const file = find(exam, section);
    edit(file);
    const problems = validateExam(file);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join('\n')).toContain(message);
    expect(problems.every((p) => p.startsWith(`${exam}.${section}`))).toBe(true);
  });
});

describe('answer positions', () => {
  it('allows exactly 40 percent', () => {
    const file = find('exam1', 's2');
    // The pictures spread over three places: no place gets over 40 percent.
    file.pictures.forEach((p: Obj, i: number) => (p.answer = i % 3));
    expect(validateExam(file)).toEqual([]);
  });
  it('judges each form on its own', () => {
    const file = find('exam1', 's2');
    file.pictures.forEach((p: Obj, i: number) => {
      p.answer = p.form === 'A' ? i % 3 : 0;
    });
    const problems = validateExam(file).join('\n');
    expect(problems).toContain('form B answer A');
    expect(problems).not.toContain('form A answer');
  });
  it('adds up the answers of all kinds in a section', () => {
    const file = find('exam2', 's2');
    for (const p of file.pictures) p.answer = 0;
    for (const passage of file.passages) for (const q of passage.questions) q.answer = 0;
    expect(validateExam(file).join('\n')).toContain('answer A');
  });
});

describe('monologues and tables are left to the talk check', () => {
  it('accepts a monologue in exam3.s2', () => {
    const file = find('exam3', 's2');
    const talk = file.talks[0];
    talk.kind = 'monologue';
    talk.lines = Array.from({ length: 5 }, (_, i) => ({
      id: `s2_mono_${i}`,
      role: 'announcer',
      en: `Please listen to notice number ${i} about the new schedule for this week please.`,
      zh: `公告${i}`,
    }));
    expect(validateExam(file)).toEqual([]);
  });
});

describe('examCopyKeys', () => {
  it('returns normalised stems and long lines once per item', () => {
    const file = find('exam2', 's1');
    file.talks[0].lines[0].en = '  I Will   See you At noon. ';
    expect(examCopyKeys(file)).toContain('i will see you at noon.');
    expect(examCopyKeys(file)).not.toContain('line 1 0.');
  });
  it('is empty for something that is not a file', () => {
    expect(examCopyKeys(null)).toEqual([]);
  });
});
