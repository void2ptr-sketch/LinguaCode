#!/usr/bin/env node
// generate-scenarios.mjs — Generate scenario + card files for lessons with < 5 scenarios

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '..', 'public', 'data', 'cpp');
const scenariosDir = path.join(baseDir, 'scenarios');
const cardsDir = path.join(baseDir, 'cards');
const manifestPath = path.join(__dirname, '..', 'public', 'data', 'content-manifest.json');
const coursePath = path.join(baseDir, 'courses', 'cpp-complete.course.json');

// Lessons that need scenarios added (current -> target)
const lessons = [
  {
    id: 'lesson-cpp-basics-pointers',
    title: 'Указатели и ссылки',
    current: 2,
    target: 5,
    prefix: 'pointers',
    topics: ['Указатели', 'Ссылки', 'Массивы и указатели', 'Указатели и функции', 'Возврат указателя из функции']
  },
  {
    id: 'lesson-cpp-basics-strings',
    title: 'Строки и потоки',
    current: 2,
    target: 5,
    prefix: 'strings',
    topics: ['std::string', 'C-style строки', 'Операции со строками', 'istringstream', 'ostringstream']
  },
  {
    id: 'lesson-cpp-basics-structs',
    title: 'Структуры и классы',
    current: 2,
    target: 5,
    prefix: 'structs',
    topics: ['Структуры', 'Классы', 'Конструкторы', 'Деструкторы', 'Методы класса']
  },
  {
    id: 'lesson-cpp-advanced-concurrency',
    title: 'Concurrency и Multithreading',
    current: 3,
    target: 5,
    prefix: 'concurrency',
    topics: ['std::thread', 'std::async', 'std::future', 'std::promise', 'std::atomic']
  },
  {
    id: 'lesson-cpp-advanced-stl',
    title: 'STL Advanced',
    current: 2,
    target: 5,
    prefix: 'stl-advanced',
    topics: ['Универсальные контейнеры', 'Алгоритмы сортировки', 'Итераторы', 'Функциональные объекты', 'Адаптеры контейнеров']
  },
  {
    id: 'lesson-cpp-basics-templates',
    title: 'Templates Intro',
    current: 1,
    target: 5,
    prefix: 'templates',
    topics: ['Шаблоны функций', 'Шаблоны классов', 'Специализация шаблонов', 'Параметры шаблонов', 'Variadic templates']
  },
  {
    id: 'lesson-cpp-basics-templates-stl',
    title: 'Templates и STL Intro',
    current: 3,
    target: 5,
    prefix: 'templates-stl',
    topics: ['Шаблоны в STL', 'Контейнеры как шаблоны', 'Алгоритмы как шаблоны', 'Iterator traits', 'Allocator']
  },
  {
    id: 'lesson-cpp-basics-stl',
    title: 'STL Intro',
    current: 3,
    target: 5,
    prefix: 'stl',
    topics: ['vector', 'map', 'set', 'pair и tuple', 'auto и type deduction']
  },
  {
    id: 'lesson-cpp-basics-exceptions',
    title: 'Exceptions и Errors',
    current: 3,
    target: 5,
    prefix: 'exceptions',
    topics: ['try-catch', 'throw и типы исключений', 'std::exception', 'Custom exceptions', 'Exception safety']
  },
  {
    id: 'lesson-cpp-basics-file-io',
    title: 'File IO',
    current: 2,
    target: 5,
    prefix: 'file-io',
    topics: ['ifstream', 'ofstream', 'fstream', 'binary files', 'file modes']
  },
  {
    id: 'lesson-cpp-basics-io',
    title: 'IO Intro',
    current: 2,
    target: 5,
    prefix: 'io',
    topics: ['cin и cout', 'printf и scanf', 'форматирование вывода', 'manipulators', 'error states']
  },
  {
    id: 'lesson-cpp-basics-classes',
    title: 'Classes',
    current: 2,
    target: 5,
    prefix: 'classes',
    topics: ['Объявление класса', 'Конструкторы и деструкторы', 'this указатель', 'static members', 'friend functions']
  },
  {
    id: 'lesson-cpp-basics-operators',
    title: 'Operators и Expressions',
    current: 1,
    target: 5,
    prefix: 'operators',
    topics: ['Арифметические операторы', 'Операторы присваивания', 'Операторы сравнения', 'Логические операторы', 'Операторы Bitwise']
  },
  {
    id: 'lesson-cpp-basics-pointers-references',
    title: 'Pointers и References',
    current: 3,
    target: 5,
    prefix: 'ptr-ref',
    topics: ['new и delete', 'nullptr', 'const pointers', 'pointer arithmetic', 'array-pointer relationship']
  },
  {
    id: 'lesson-cpp-basics-streams',
    title: 'Streams и Files',
    current: 2,
    target: 5,
    prefix: 'streams',
    topics: ['iostream hierarchy', 'std::stringstream', 'custom manipulators', 'file streams', 'error handling in streams']
  },
  {
    id: 'lesson-cpp-basics-algorithms',
    title: 'Algorithms Intro',
    current: 1,
    target: 5,
    prefix: 'algorithms',
    topics: ['std::find', 'std::sort', 'std::for_each', 'std::transform', 'std::accumulate']
  },
  {
    id: 'lesson-cpp-basics-modern-cpp',
    title: 'Modern C++',
    current: 1,
    target: 5,
    prefix: 'modern-cpp',
    topics: ['auto и type inference', 'nullptr', 'range-based for', 'lambda expressions', 'std::move и std::forward']
  },
  {
    id: 'lesson-cpp-basics-multithreading',
    title: 'Multithreading',
    current: 1,
    target: 5,
    prefix: 'multithreading',
    topics: ['std::thread basics', 'std::mutex', 'std::lock_guard', 'std::async', 'std::future']
  },
  {
    id: 'lesson-cpp-basics-networking',
    title: 'Networking',
    current: 1,
    target: 5,
    prefix: 'networking',
    topics: ['sockets basics', 'TCP vs UDP', 'HTTP client', 'HTTP server', 'async I/O']
  },
  {
    id: 'lesson-cpp-basics-systems',
    title: 'Systems Programming',
    current: 1,
    target: 5,
    prefix: 'systems',
    topics: ['memory layout', 'stack vs heap', 'system calls', 'processes', 'signals']
  }
];

function generateCard(scenarioId, cardNum, topic) {
  return {
    id: `${scenarioId}.card-${String(cardNum).padStart(2, '0')}`,
    kind: 'select',
    title: `${topic} — Вопрос ${cardNum}`,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
    direction: 'known-to-learning',
    promptKnown: `Вопрос ${cardNum} по теме "${topic}"`,
    optionsLearning: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
    correctIndex: 0,
    meta: { knownLanguage: 'ru', learningLanguage: 'cpp', difficulty: 'beginner', tags: ['language-basics'] },
    courseId: 'course-cpp-complete',
    lessonId: '',
    scenarioId
  };
}

function generateScenarioFile(lesson, scenarioNum, topic) {
  const scenarioId = `cpp.${lesson.prefix}.${String(scenarioNum).padStart(2, '0')}.scenario`;
  const cardIds = Array.from({ length: 20 }, (_, i) => `${scenarioId}.card-${String(i + 1).padStart(2, '0')}`);
  const now = new Date().toISOString();

  return {
    scenarios: [{
      id: scenarioId,
      title: topic,
      description: `Сценарий: ${topic}`,
      order: scenarioNum - 1,
      lessonId: lesson.id,
      courseId: 'course-cpp-complete',
      cardCount: 20,
      authoring: { status: 'materialized', updatedAt: now },
      languagePair: { known: 'ru', learning: 'cpp' },
      published: true,
      updatedAt: now,
      authorId: 'system',
      cardSource: {
        mode: 'snapshot',
        cardIds,
        criteria: {},
        frozenAt: now
      }
    }]
  };
}

function generateCardFile(scenarioId, topic) {
  const cards = Array.from({ length: 20 }, (_, i) =>
    generateCard(scenarioId, i + 1, topic)
  );
  return { scenarioId, cards };
}

// Main generation
let newScenarios = [];
let newCards = [];

for (const lesson of lessons) {
  const needed = lesson.target - lesson.current;
  for (let i = 0; i < needed; i++) {
    const scenarioNum = lesson.current + i + 1;
    const topic = lesson.topics[i] || `Тема ${scenarioNum}`;
    
    const scenarioData = generateScenarioFile(lesson, scenarioNum, topic);
    const cardData = generateCardFile(scenarioData.scenarios[0].id, topic);
    
    const scenarioFileName = `cpp.${lesson.prefix}.${String(scenarioNum).padStart(2, '0')}.scenario.json`;
    const cardFileName = `cpp.${lesson.prefix}.${String(scenarioNum).padStart(2, '0')}.cards.json`;
    
    fs.writeFileSync(
      path.join(scenariosDir, scenarioFileName),
      JSON.stringify(scenarioData, null, 2) + '\n'
    );
    
    fs.writeFileSync(
      path.join(cardsDir, cardFileName),
      JSON.stringify(cardData, null, 2) + '\n'
    );
    
    newScenarios.push(`/cpp/scenarios/${scenarioFileName}`);
    newCards.push(`/cpp/cards/${cardFileName}`);
    
    console.log(`✓ ${scenarioFileName} + ${cardFileName} (${topic})`);
  }
}

// Update manifest
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.cardFiles = [...manifest.cardFiles, ...newCards];
manifest.scenarioFiles = [...manifest.scenarioFiles, ...newScenarios];
manifest.version = manifest.version + 1;

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n✓ Manifest updated (v${manifest.version})`);

// Update course file
const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf8'));

for (const lesson of lessons) {
  const lessonIdx = courseData.lessons.findIndex(l => l.id === lesson.id);
  if (lessonIdx === -1) continue;
  
  const lessonData = courseData.lessons[lessonIdx];
  const needed = lesson.target - lesson.current;
  
  for (let i = 0; i < needed; i++) {
    const scenarioNum = lesson.current + i + 1;
    const topic = lesson.topics[i] || `Тема ${scenarioNum}`;
    const scenarioId = `cpp.${lesson.prefix}.${String(scenarioNum).padStart(2, '0')}.scenario`;
    
    if (!lessonData.scenarioIds.includes(scenarioId)) {
      lessonData.scenarioIds.push(scenarioId);
    }
  }
  
  lessonData.updatedAt = new Date().toISOString();
  lessonData.description = `${lesson.target} сценариев: ${lesson.topics.join(', ')}.`;
  
  console.log(`✓ Updated lesson: ${lessonData.title} (${lessonData.scenarioIds.length} scenarios)`);
}

fs.writeFileSync(coursePath, JSON.stringify(courseData, null, 2) + '\n');
console.log('\n✓ Course file updated');
console.log(`\nTotal: ${newScenarios.length} scenarios + ${newCards.length} cards generated`);
