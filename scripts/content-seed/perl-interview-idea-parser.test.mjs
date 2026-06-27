import assert from 'node:assert/strict';

import { parsePerlInterviewIdea } from './perl-interview-idea-parser.mjs';

const sample = `
## Цели
Meta

## Этап 1: Контексты
- Вопрос один?
- Вопрос два?

## Этап 2: Regex
- Захваты?
`;

const stages = parsePerlInterviewIdea(sample);

assert.equal(stages.length, 2);
assert.equal(stages[0].title, 'Контексты');
assert.deepEqual(stages[0].questions, ['Вопрос один?', 'Вопрос два?']);
assert.equal(stages[1].questions.length, 1);

const withComment = parsePerlInterviewIdea(`<!-- ## Этап 99: ghost\n- bad? -->`);
assert.equal(withComment.length, 0);

console.log('perl-interview-idea-parser.test.mjs: ok');
