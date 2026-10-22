export * from './course-ids';
export * from './course.types';
export * from './course-authoring.types';
export * from './course-index.types';
export * from './course-practice.types';
export * from './lesson.types';

// Re-export Program types from entities/program/model
export type { Program, ProgramWithLessons } from '../../program/model/program.types';
export type { CourseWithPrograms } from './course.types';
export { RADICALS_PROGRAM_ID } from '../../program/model/program-ids';
