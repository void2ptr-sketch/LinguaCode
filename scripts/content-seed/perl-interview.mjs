/** Perl interview course seed (ru→perl) — materialized from perl-interview-idea.md */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PERL_INTERVIEW_CARD_CONTENT,
  cardContentKey,
} from './perl-interview-cards-content.mjs';
import { parsePerlInterviewIdea } from './perl-interview-idea-parser.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));

export const RU_PERL_LANGUAGE_PAIR = { known: 'ru', learning: 'perl' };

export const PERL_INTERVIEW_COURSE_TITLE = 'Собеседование на языке Perl';

export const PERL_INTERVIEW_COURSE_ID = 'course-ru-perl-interview';

export const PERL_INTERVIEW_IDEA_PATH = join(scriptDir, 'perl-interview-idea.md');

export const PERL_INTERVIEW_UPDATED_AT = '2026-06-14T18:00:00.000Z';

const CARD_APPEARANCE = { theme: 'azure-blue', fontSize: 'md' };

export function readPerlInterviewIdea() {
  try {
    return readFileSync(PERL_INTERVIEW_IDEA_PATH, 'utf8').trim();
  } catch {
    return '';
  }
}

export function buildPerlInterviewAuthoring() {
  const idea = readPerlInterviewIdea();
  if (!idea) {
    return undefined;
  }

  return {
    idea,
    status: 'planned',
    ideaUpdatedAt: PERL_INTERVIEW_UPDATED_AT,
  };
}

function lessonId(stageIndex) {
  return `lesson-perl-interview-${String(stageIndex + 1).padStart(2, '0')}`;
}

function scenarioId(stageIndex, questionIndex) {
  return `scenario-perl-s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}`;
}

function cardId(stageIndex, questionIndex, cardIndex) {
  return `card-perl-s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}-c${cardIndex + 1}`;
}

function cardsPerScenario(stageIndex, questionIndex) {
  return 2 + ((stageIndex + questionIndex) % 2);
}

function stageDifficulty(stageIndex) {
  return stageIndex < 2 ? 'beginner' : stageIndex < 4 ? 'intermediate' : 'advanced';
}

function buildCardFromContent(id, title, content) {
  const base = {
    id,
    title,
    appearance: CARD_APPEARANCE,
    direction: 'known-to-learning',
  };

  if (content.kind === 'keyboard') {
    return {
      ...base,
      kind: 'keyboard',
      promptKnown: content.promptKnown,
      acceptedAnswersLearning: content.acceptedAnswersLearning,
      acceptedAnswersKnown: content.acceptedAnswersKnown,
      answerMode: content.answerMode,
    };
  }

  return {
    ...base,
    kind: 'select',
    promptKnown: content.promptKnown,
    optionsLearning: content.optionsLearning,
    optionsKnown: content.optionsKnown,
    correctIndex: content.correctIndex ?? 0,
  };
}

function buildCardsForQuestion(stageTitle, question, stageIndex, questionIndex) {
  const count = cardsPerScenario(stageIndex, questionIndex);
  const cards = [];

  for (let cardIndex = 0; cardIndex < count; cardIndex += 1) {
    const id = cardId(stageIndex, questionIndex, cardIndex);
    const key = cardContentKey(stageIndex, questionIndex, cardIndex);
    const content = PERL_INTERVIEW_CARD_CONTENT[key];
    if (!content) {
      throw new Error(`Missing Perl interview card content for ${key} (${id})`);
    }

    const title = truncate(`${question} (${cardIndex + 1}/${count})`, 96);
    cards.push(buildCardFromContent(id, title, content));
  }

  return cards;
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function buildPerlInterviewMaterialized() {
  const stages = parsePerlInterviewIdea(readPerlInterviewIdea());
  const cards = [];
  const scenarios = [];
  const lessons = [];
  const cardIndexMeta = {};

  for (const [stageIndex, stage] of stages.entries()) {
    const lessonScenarioIds = [];

    for (const [questionIndex, question] of stage.questions.entries()) {
      const scenarioCards = buildCardsForQuestion(stage.title, question, stageIndex, questionIndex);
      const scenarioCardIds = scenarioCards.map((card) => card.id);
      cards.push(...scenarioCards);

      const scenario = {
        id: scenarioId(stageIndex, questionIndex),
        title: question,
        description: `Тема собеседования Perl (этап «${stage.title}»). Карточек: ${scenarioCards.length}.`,
        authorId: 'system',
        published: true,
        updatedAt: PERL_INTERVIEW_UPDATED_AT,
        languagePair: RU_PERL_LANGUAGE_PAIR,
        cardSource: {
          mode: 'fixed',
          cardIds: scenarioCardIds,
        },
      };

      scenarios.push(scenario);
      lessonScenarioIds.push(scenario.id);

      for (const cardIdValue of scenarioCardIds) {
        const difficulty = stageDifficulty(stageIndex);
        cardIndexMeta[cardIdValue] = {
          knownLanguage: 'ru',
          learningLanguage: 'perl',
          difficulty,
          tags: [difficulty, slugTag(stage.title), slugTag(question)],
          updatedAt: PERL_INTERVIEW_UPDATED_AT,
        };
      }
    }

    lessons.push({
      id: lessonId(stageIndex),
      courseId: PERL_INTERVIEW_COURSE_ID,
      title: stage.title,
      description: `${stage.questions.length} тем (сценариев) для этапа «${stage.title}».`,
      scenarioIds: lessonScenarioIds,
      prerequisiteLessonIds: stageIndex === 0 ? [] : [lessonId(stageIndex - 1)],
      order: stageIndex,
      updatedAt: PERL_INTERVIEW_UPDATED_AT,
    });
  }

  return { cards, scenarios, lessons, cardIndexMeta };
}

function slugTag(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function buildPerlInterviewCards() {
  return buildPerlInterviewMaterialized().cards;
}

export function buildPerlInterviewCardIndexMeta() {
  return buildPerlInterviewMaterialized().cardIndexMeta;
}

export function buildPerlInterviewScenarios() {
  return buildPerlInterviewMaterialized().scenarios;
}

export function buildPerlInterviewCourse() {
  const { lessons } = buildPerlInterviewMaterialized();
  const authoring = buildPerlInterviewAuthoring();

  return {
    courses: [
      {
        id: PERL_INTERVIEW_COURSE_ID,
        title: PERL_INTERVIEW_COURSE_TITLE,
        description: 'Подготовка к техническому собеседованию по Perl: программа сгенерирована из «Идеи программы».',
        authorId: 'system',
        languagePair: RU_PERL_LANGUAGE_PAIR,
        lessonIds: lessons.map((lesson) => lesson.id),
        published: true,
        updatedAt: PERL_INTERVIEW_UPDATED_AT,
        ...(authoring ? { authoring } : {}),
        practiceSettings: {
          mode: 'open',
          requireLessonForScenarios: false,
          enforceLessonPrerequisites: false,
          allowDifficultyFilter: true,
        },
      },
    ],
    lessons,
  };
}
