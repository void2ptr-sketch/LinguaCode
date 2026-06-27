import { writeFileSync } from 'node:fs';
import { KANGXI_RADICALS } from './kangxi-radicals.mjs';
import { KANGXI_RADICAL_META } from './kangxi-radical-meta.mjs';

export {
  RADICALS_COURSE_ID,
  RADICALS_PER_SCENARIO,
  RADICALS_LESSON_COUNT,
  radicalCardId,
  radicalLessonId,
  radicalScenarioId,
  radicalLessonRange,
  radicalLessonCardIds,
} from './content-seed/radicals-content.mjs';

function buildDrawCard(index) {
  const character = KANGXI_RADICALS[index - 1];
  const meta = KANGXI_RADICAL_META[index - 1];
  const meaning = meta?.meaningRu ?? `радикал №${index}`;
  const pinyin = meta?.pinyin ?? '';

  return {
    id: `draw-radical-${String(index).padStart(3, '0')}`,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = { cards: KANGXI_RADICALS.map((_, index) => buildDrawCard(index + 1)) };
  writeFileSync(
    new URL('../public/data/radicals-course-cards.json', import.meta.url),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
  console.log(`Generated ${fixture.cards.length} draw cards → public/data/radicals-course-cards.json`);
}
