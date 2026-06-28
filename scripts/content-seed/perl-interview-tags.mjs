/** Теги Perl interview: сложность + тема (из Идеи) + подтема (сценарий). */

export const PERL_INTERVIEW_THEMES = [
  { id: 'intro', label: 'Введение' },
  { id: 'basics', label: 'Основы' },
  { id: 'modern-perl', label: 'Современный Perl' },
  { id: 'tools', label: 'Инструменты' },
  { id: 'architecture-legacy', label: 'Архитектура и работа с легаси' },
  { id: 'practice', label: 'Практика' },
  { id: 'oop', label: 'ООП' },
];

export const PERL_INTERVIEW_SUBTOPICS = [
  { key: 's01-q01', id: 'scalar-context', label: 'Scalar / list context' },
  { key: 's01-q02', id: 'array-scalar', label: '@array в scalar context' },
  { key: 's01-q03', id: 'sigils', label: 'Sigils $, @, %' },
  { key: 's01-q04', id: 'undef', label: 'undef' },
  { key: 's02-q01', id: 'use-strict', label: 'use strict' },
  { key: 's02-q02', id: 'use-warnings', label: 'use warnings' },
  { key: 's02-q03', id: 'my-our', label: 'my / our / globals' },
  { key: 's02-q04', id: 'feature-say', label: "use feature 'say'" },
  { key: 's03-q01', id: 'regex-captures', label: 'Захваты $1, $2' },
  { key: 's03-q02', id: 'regex-modifiers', label: 'Модификаторы /g, /i, /x' },
  { key: 's03-q03', id: 'match-operators', label: '=~ / !~' },
  { key: 's03-q04', id: 'qr-compile', label: 'qr//' },
  { key: 's04-q01', id: 'sub-args', label: '@_ в sub' },
  { key: 's04-q02', id: 'map-grep', label: 'map / grep' },
  { key: 's04-q03', id: 'spaceship', label: '<=>' },
  { key: 's04-q04', id: 'sort', label: 'sort / block sort' },
  { key: 's05-q01', id: 'use-require', label: 'use / require' },
  { key: 's05-q02', id: 'bless-oop', label: 'bless / ООП' },
  { key: 's05-q03', id: 'file-io', label: 'Файлы и ошибки' },
  { key: 's05-q04', id: 'red-flags', label: 'Red flags на интервью' },
  { key: 's06-q01', id: 'dbi-dbd', label: 'DBI и DBD' },
  { key: 's06-q02', id: 'dbi-placeholders', label: 'Placeholders в DBI' },
  { key: 's06-q03', id: 'dbi-prepare-execute', label: 'prepare / execute / do' },
  { key: 's06-q04', id: 'dbi-transactions', label: 'Транзакции DBI' },
  { key: 's06-q05', id: 'dbi-errors', label: 'Ошибки DBI' },
  { key: 's07-q01', id: 'cgi-module', label: 'Модуль CGI' },
  { key: 's07-q02', id: 'cgi-params', label: 'Параметры CGI' },
  { key: 's07-q03', id: 'cgi-binmode', label: 'binmode в CGI' },
  { key: 's07-q04', id: 'cgi-headers', label: 'HTTP-заголовки CGI' },
  { key: 's07-q05', id: 'cgi-legacy', label: 'CGI vs PSGI' },
  { key: 's08-q01', id: 'oracle-dsn', label: 'Oracle DSN' },
  { key: 's08-q02', id: 'oracle-placeholders', label: 'Oracle placeholders' },
  { key: 's08-q03', id: 'oracle-connect', label: 'SID / service name' },
  { key: 's08-q04', id: 'oracle-plsql', label: 'PL/SQL через DBI' },
  { key: 's08-q05', id: 'oracle-lob', label: 'CLOB / BLOB' },
];

/** Единый тег СУБД для Oracle-сценариев (этап 8). */
export const PERL_INTERVIEW_ORACLE_TAG = 'oracle';

/** 0-based индекс этапа «Oracle (DBD::Oracle)». */
export const PERL_INTERVIEW_ORACLE_STAGE_INDEX = 7;

/** theme id по ключу сценария s{stage}-q{question} */
export const PERL_INTERVIEW_THEME_BY_SCENARIO = {
  's01-q01': 'basics',
  's01-q02': 'basics',
  's01-q03': 'basics',
  's01-q04': 'basics',
  's02-q01': 'modern-perl',
  's02-q02': 'modern-perl',
  's02-q03': 'basics',
  's02-q04': 'modern-perl',
  's03-q01': 'basics',
  's03-q02': 'basics',
  's03-q03': 'basics',
  's03-q04': 'basics',
  's04-q01': 'basics',
  's04-q02': 'practice',
  's04-q03': 'practice',
  's04-q04': 'practice',
  's05-q01': 'tools',
  's05-q02': 'oop',
  's05-q03': 'practice',
  's05-q04': 'architecture-legacy',
  's06-q01': 'practice',
  's06-q02': 'practice',
  's06-q03': 'practice',
  's06-q04': 'practice',
  's06-q05': 'practice',
  's07-q01': 'architecture-legacy',
  's07-q02': 'architecture-legacy',
  's07-q03': 'architecture-legacy',
  's07-q04': 'architecture-legacy',
  's07-q05': 'architecture-legacy',
  's08-q01': 'practice',
  's08-q02': 'practice',
  's08-q03': 'practice',
  's08-q04': 'practice',
  's08-q05': 'practice',
};

const SUBTOPIC_BY_KEY = Object.fromEntries(
  PERL_INTERVIEW_SUBTOPICS.map((entry) => [entry.key, entry.id]),
);

export function scenarioTagKey(stageIndex, questionIndex) {
  return `s${String(stageIndex + 1).padStart(2, '0')}-q${String(questionIndex + 1).padStart(2, '0')}`;
}

export function buildPerlInterviewTags(stageIndex, questionIndex, difficulty) {
  const key = scenarioTagKey(stageIndex, questionIndex);
  const theme = PERL_INTERVIEW_THEME_BY_SCENARIO[key];
  const subtopic = SUBTOPIC_BY_KEY[key];

  if (!theme) {
    throw new Error(`Missing Perl interview theme for scenario ${key}`);
  }
  if (!subtopic) {
    throw new Error(`Missing Perl interview subtopic for scenario ${key}`);
  }

  const tags = [difficulty, theme, subtopic];
  if (stageIndex === PERL_INTERVIEW_ORACLE_STAGE_INDEX) {
    tags.push(PERL_INTERVIEW_ORACLE_TAG);
  }

  return tags;
}

/** id → label для UI каталога (темы + подтемы; сложность — id как есть). */
export const PERL_TAG_LABELS = Object.fromEntries([
  [PERL_INTERVIEW_ORACLE_TAG, 'Oracle'],
  ...PERL_INTERVIEW_THEMES.map((theme) => [theme.id, theme.label]),
  ...PERL_INTERVIEW_SUBTOPICS.map((subtopic) => [subtopic.id, subtopic.label]),
]);
