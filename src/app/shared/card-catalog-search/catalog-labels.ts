import type { CardDifficulty, CardKind } from '../../core/models';
import { CONTENT_LANGUAGE_LABELS, contentLanguages } from '../../core/data/language-pair.utils';

export { CONTENT_LANGUAGE_LABELS };

export const DIFFICULTY_LABELS: Record<CardDifficulty, string> = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

export const CARD_KIND_LABELS: Record<CardKind, string> = {
  select: 'Выбор ответа',
  'code-select': 'Код: выбор ответа',
  memory: 'Запоминание',
  symbol: 'Символы',
  sound: 'Звук',
  timed: 'На время',
  keyboard: 'Клавиатура',
  draw: 'Рисование',
  tone: 'Тон',
  reading: 'Чтение (полифония)',
};

export const CARD_KINDS: readonly CardKind[] = [
  'select',
  'code-select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
  'tone',
  'reading',
];

export const CONTENT_LANGUAGES = contentLanguages();

export const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];

/** Подписи тегов каталога (id → label). Сложность — id без перевода. */
export const TAG_LABELS: Record<string, string> = {
  // Demo / общие
  greetings: 'Приветствия',
  vocabulary: 'Лексика',
  memory: 'Память',
  symbols: 'Символы',
  visual: 'Визуальное',
  listening: 'Аудирование',
  timed: 'На время',
  keyboard: 'Клавиатура',
  ipa: 'IPA',
  phonetics: 'Фонетика',
  numbers: 'Числа',
  reading: 'Чтение',
  polyphony: 'Полифония',
  // Perl interview — темы
  intro: 'Введение',
  basics: 'Основы',
  'modern-perl': 'Современный Perl',
  tools: 'Инструменты',
  'architecture-legacy': 'Архитектура и работа с легаси',
  practice: 'Практика',
  oop: 'ООП',
  // Perl interview — подтемы
  'scalar-context': 'Scalar / list context',
  'array-scalar': '@array в scalar context',
  sigils: 'Sigils $, @, %',
  undef: 'undef',
  'use-strict': 'use strict',
  'use-warnings': 'use warnings',
  'my-our': 'my / our / globals',
  'feature-say': "use feature 'say'",
  'regex-captures': 'Захваты $1, $2',
  'regex-modifiers': 'Модификаторы /g, /i, /x',
  'match-operators': '=~ / !~',
  'qr-compile': 'qr//',
  'sub-args': '@_ в sub',
  'map-grep': 'map / grep',
  spaceship: '<=>',
  sort: 'sort / block sort',
  'use-require': 'use / require',
  'bless-oop': 'bless / ООП',
  'file-io': 'Файлы и ошибки',
  'red-flags': 'Red flags на интервью',
  'dbi-dbd': 'DBI и DBD',
  'dbi-placeholders': 'Placeholders в DBI',
  'dbi-prepare-execute': 'prepare / execute / do',
  'dbi-transactions': 'Транзакции DBI',
  'dbi-errors': 'Ошибки DBI',
  'cgi-module': 'Модуль CGI',
  'cgi-params': 'Параметры CGI',
  'cgi-binmode': 'binmode в CGI',
  'cgi-headers': 'HTTP-заголовки CGI',
  'cgi-legacy': 'CGI vs PSGI',
  oracle: 'Oracle',
  'oracle-dsn': 'Oracle DSN',
  'oracle-placeholders': 'Oracle placeholders',
  'oracle-connect': 'SID / service name',
  'oracle-plsql': 'PL/SQL через DBI',
  'oracle-lob': 'CLOB / BLOB',
};

const DIFFICULTY_TAG_IDS = new Set<string>(['beginner', 'intermediate', 'advanced']);

export function tagLabel(tag: string): string {
  if (DIFFICULTY_TAG_IDS.has(tag)) {
    return tag;
  }

  return TAG_LABELS[tag] ?? tag;
}
