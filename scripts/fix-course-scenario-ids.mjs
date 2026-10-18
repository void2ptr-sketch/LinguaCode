#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scenariosDir = path.join(__dirname, '..', 'public', 'data', 'cpp', 'scenarios');
const coursePath = path.join(__dirname, '..', 'public', 'data', 'cpp', 'courses', 'cpp-complete.course.json');

// Read all scenario files and extract IDs
const scenarioIdsByLesson = {};
const allScenarioIds = new Set();

const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith('.scenario.json'));
for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(scenariosDir, file), 'utf8'));
  if (content.scenarios) {
    for (const scenario of content.scenarios) {
      allScenarioIds.add(scenario.id);
      const lessonId = scenario.lessonId;
      if (!scenarioIdsByLesson[lessonId]) {
        scenarioIdsByLesson[lessonId] = [];
      }
      scenarioIdsByLesson[lessonId].push(scenario.id);
    }
  }
}

// Read course
const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));

// Fix each lesson
let changes = 0;
for (const lesson of course.lessons) {
  const realIds = scenarioIdsByLesson[lesson.id] || [];
  const currentIds = lesson.scenarioIds || [];
  
  // Find missing and extra
  const missing = realIds.filter(id => !currentIds.includes(id));
  const extra = currentIds.filter(id => !realIds.includes(id));
  
  if (missing.length > 0 || extra.length > 0) {
    console.log(`\nLesson: ${lesson.title} (${lesson.id})`);
    console.log(`  Missing from course: ${missing.length}`);
    missing.forEach(id => console.log(`    + ${id}`));
    console.log(`  Extra in course (not on disk): ${extra.length}`);
    extra.forEach(id => console.log(`    - ${id}`));
    
    // Update with real IDs
    lesson.scenarioIds = realIds;
    lesson.updatedAt = new Date().toISOString();
    lesson.description = `${realIds.length} сценариев: ${realIds.map(id => id.replace('cpp.', '').replace('.scenario', '')).join(', ')}.`;
    changes++;
  }
}

fs.writeFileSync(coursePath, JSON.stringify(course, null, 2) + '\n');
console.log(`\n✓ Updated ${changes} lessons`);
console.log(`✓ Total scenarios on disk: ${allScenarioIds.size}`);
