import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  buildLessonsById,
  isLessonUnlocked,
  prerequisiteBlockReason,
} from '../../core/data/lesson-prerequisites.utils';
import { CourseSearchService } from '../../core/data';
import type { Lesson } from '../../core/models';
import { LearningResultsStore } from '../../core/state';

export type LessonPickPayload = {
  lessonId: string;
  title: string;
  scenarioIds: readonly string[];
};

type LessonListItem = {
  lesson: Lesson;
  unlocked: boolean;
  completed: boolean;
  blockReason: string | null;
};

@Component({
  selector: 'app-lesson-picker',
  imports: [MatIconModule, MatProgressSpinnerModule],
  templateUrl: './lesson-picker.component.html',
  styleUrl: './lesson-picker.component.scss',
})
export class LessonPickerComponent {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly resultsStore = inject(LearningResultsStore);

  readonly selectedCourseId = input.required<string>();
  readonly selectedLessonId = input.required<string>();
  readonly autoPickFirstLesson = input(false);

  readonly selectedLessonIdChange = output<string>();
  readonly lessonPickChange = output<LessonPickPayload>();

  readonly lessons = signal<readonly Lesson[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly lessonItems = computed<readonly LessonListItem[]>(() => {
    const lessons = this.lessons();
    const lessonsById = buildLessonsById(lessons);
    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;

    return lessons.map((lesson) => ({
      lesson,
      unlocked: isLessonUnlocked(lesson, lessonsById, hasScenarioResult),
      completed: this.resultsStore.isLessonCompleted(lesson.scenarioIds),
      blockReason: prerequisiteBlockReason(lesson, lessons, hasScenarioResult),
    }));
  });

  private readonly loadOnCourseChange = effect(() => {
    const courseId = this.selectedCourseId();
    void this.loadLessons(courseId);
  });

  private readonly pickFirstUnlocked = effect(() => {
    if (!this.autoPickFirstLesson()) {
      return;
    }

    const items = this.lessonItems();
    const current = this.selectedLessonId();
    const currentItem = items.find((item) => item.lesson.id === current);

    if (currentItem?.unlocked) {
      return;
    }

    const firstUnlocked = items.find((item) => item.unlocked);
    if (firstUnlocked) {
      this.pick(firstUnlocked.lesson);
    }
  });

  async loadLessons(courseId: string): Promise<void> {
    this.lessons.set([]);
    this.error.set(null);

    if (!courseId) {
      return;
    }

    this.loading.set(true);

    try {
      const course = await this.courseSearchService.getById(courseId);
      const sorted = [...course.lessons].sort((left, right) => left.order - right.order);
      this.lessons.set(sorted);
    } catch {
      this.error.set('Не удалось загрузить уроки курса');
    } finally {
      this.loading.set(false);
    }
  }

  pick(lesson: Lesson): void {
    const lessonsById = buildLessonsById(this.lessons());
    const hasScenarioResult = (scenarioId: string) =>
      this.resultsStore.resultsForScenario(scenarioId).length > 0;

    if (!isLessonUnlocked(lesson, lessonsById, hasScenarioResult)) {
      return;
    }

    this.selectedLessonIdChange.emit(lesson.id);
    this.emitLesson(lesson);
  }

  private emitLesson(lesson: Lesson): void {
    this.lessonPickChange.emit({
      lessonId: lesson.id,
      title: lesson.title,
      scenarioIds: lesson.scenarioIds,
    });
  }
}
