import assert from 'node:assert/strict';

import { parsePerlInterviewIdea } from './perl-interview-idea-parser.mjs';
import { readPerlInterviewIdea } from './perl-interview.mjs';
import {
  PERL_INTERVIEW_SUBTOPICS,
  PERL_INTERVIEW_THEMES,
  PERL_INTERVIEW_THEME_BY_SCENARIO,
  buildPerlInterviewTags,
  scenarioTagKey,
} from './perl-interview-tags.mjs';

const stages = parsePerlInterviewIdea(readPerlInterviewIdea());
const scenarioKeys = [];

for (const [stageIndex, stage] of stages.entries()) {
  for (const [questionIndex] of stage.questions.entries()) {
    scenarioKeys.push(scenarioTagKey(stageIndex, questionIndex));
  }
}

assert.equal(scenarioKeys.length, 35);
assert.equal(PERL_INTERVIEW_SUBTOPICS.length, 35);
assert.equal(Object.keys(PERL_INTERVIEW_THEME_BY_SCENARIO).length, 35);

for (const key of scenarioKeys) {
  assert.ok(PERL_INTERVIEW_THEME_BY_SCENARIO[key], `theme missing for ${key}`);
  const subtopic = PERL_INTERVIEW_SUBTOPICS.find((entry) => entry.key === key);
  assert.ok(subtopic, `subtopic missing for ${key}`);

  const stageIndex = Number.parseInt(key.slice(1, 3), 10) - 1;
  const difficulty =
    stageIndex < 2 ? 'beginner' : stageIndex < 4 ? 'intermediate' : 'advanced';
  const tags = buildPerlInterviewTags(
    stageIndex,
    Number.parseInt(key.slice(5, 7), 10) - 1,
    difficulty,
  );

  const expectedLength = stageIndex === 7 ? 4 : 3;
  assert.equal(tags.length, expectedLength);
  assert.equal(tags[0], difficulty);
  assert.equal(tags[1], PERL_INTERVIEW_THEME_BY_SCENARIO[key]);
  assert.equal(tags[2], subtopic.id);
  if (stageIndex === 7) {
    assert.equal(tags[3], 'oracle');
  }
  assert.doesNotMatch(tags[2], /-{2,}$/, 'subtopic id must not look truncated');
}

const themeIds = new Set(PERL_INTERVIEW_THEMES.map((theme) => theme.id));
for (const themeId of Object.values(PERL_INTERVIEW_THEME_BY_SCENARIO)) {
  assert.ok(themeIds.has(themeId), `unknown theme id: ${themeId}`);
}

console.log('perl-interview-tags.test.mjs: ok');
