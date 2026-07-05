import { Injectable, inject, signal } from '@angular/core';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
} from '../../models';

import { CoursesApiService, type CourseWritePayload } from './courses-api.service';

@Injectable({ providedIn: 'root' })
export class CourseSearchService {
  private readonly coursesApi = inject(CoursesApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return this.run(() => this.coursesApi.search(criteria));
  }

  getById(courseId: string): Promise<CourseWithLessons> {
    return this.run(() => this.coursesApi.getById(courseId));
  }

  create(payload: CourseWritePayload): Promise<CourseWithLessons> {
    return this.run(() => this.coursesApi.create(payload));
  }

  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons> {
    return this.run(() => this.coursesApi.update(courseId, payload));
  }

  delete(courseId: string): Promise<void> {
    return this.run(() => this.coursesApi.delete(courseId));
  }

  findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]> {
    return this.run(() => this.coursesApi.findUsingScenario(scenarioId));
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    this.loading.set(true);
    this.error.set(null);

    try {
      return await action();
    } catch {
      this.error.set('Не удалось выполнить операцию с курсами');
      throw new Error('Course operation failed');
    } finally {
      this.loading.set(false);
    }
  }
}
