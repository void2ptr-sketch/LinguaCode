import { writeFileSync } from 'node:fs';
import { KANGXI_RADICALS } from './kangxi-radicals.mjs';
import { KANGXI_RADICAL_META } from './kangxi-radical-meta.mjs';

export const RADICALS_COURSE_ID = 'course-zh-radicals-214';
export const RADICALS_PER_SCENARIO = 50;
export const RADICALS_LESSON_COUNT = Math.ceil(KANGXI_RADICALS.length / RADICALS_PER_SCENARIO);

export function radicalCardId(index) {
  return `draw-radical-${String(index).padStart(3, '0')}`;
}

export function radicalLessonId(lessonIndex) {
  return `lesson-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalScenarioId(lessonIndex) {
  return `scenario-radicals-${String(lessonIndex + 1).padStart(2, '0')}`;
}

export function radicalLessonRange(lessonIndex) {
  const start = lessonIndex * RADICALS_PER_SCENARIO + 1;
  const end = Math.min(start + RADICALS_PER_SCENARIO - 1, KANGXI_RADICALS.length);
  return { start, end };
}

export function radicalLessonCardIds(lessonIndex) {
  const { start, end } = radicalLessonRange(lessonIndex);
  return Array.from({ length: end - start + 1 }, (_, offset) => radicalCardId(start + offset));
}

function buildDrawCard(index) {
  const character = KANGXI_RADICALS[index - 1];
  const meta = KANGXI_RADICAL_META[index - 1];
  const meaning = meta?.meaningRu ?? `радикал №${index}`;
  const pinyin = meta?.pinyin ?? '';

  return {
    id: radicalCardId(index),
    kind: 'draw',
    title: `Радикал №${index}: ${character}`,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    promptKnown: `Нарисуйте радикал №${index} «${character}»`,
    referenceHintKnown: pinyin ? `${meaning} (${pinyin})` : meaning,
    meaningKnown: meaning,
    practiceMode: 'tracing',
    targetCharacter: character,
    promptLexeme: {
      primary: character,
      script: 'hani',
      ...(pinyin ? { pinyin } : {}),
    },
  };
}

function buildCardsFixture() {
  return {
    cards: KANGXI_RADICALS.map((_, index) => buildDrawCard(index + 1)),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = buildCardsFixture();
  writeFileSync(
    new URL('../public/data/radicals-course-cards.json', import.meta.url),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
  console.log(`Generated ${fixture.cards.length} draw cards → public/data/radicals-course-cards.json`);
}
