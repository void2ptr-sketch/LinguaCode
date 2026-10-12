export const RADICALS_COURSE_ID = 'course-zh-radicals-214';
export const RADICALS_PER_SCENARIO = 20;
export const RADICALS_TOTAL = 214;
export const RADICALS_LESSON_COUNT = Math.ceil(RADICALS_TOTAL / RADICALS_PER_SCENARIO);

export function radicalCardId(index: number): string {
  return `draw-radical-${String(index).padStart(3, '0')}`;
}

export function radicalLessonCardIds(lessonIndex: number): readonly string[] {
  const start = lessonIndex * RADICALS_PER_SCENARIO + 1;
  const end = Math.min(start + RADICALS_PER_SCENARIO - 1, RADICALS_TOTAL);
  return Array.from({ length: end - start + 1 }, (_, offset) => radicalCardId(start + offset));
}

export function isObsoleteRadicalsCatalogItem(id: string): boolean {
  const match = /^(?:lesson|scenario)-radicals-(\d{2})$/.exec(id);
  if (!match) {
    return false;
  }

  return Number(match[1]) > RADICALS_LESSON_COUNT;
}
