import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { ContentLanguage } from '../../../entities/card/model';
import {
  initialCourseTabDraftsState,
  type CourseTabDraftsState,
} from '../models/course-tab-drafts-store';

/**
 * Store черновиков вкладки «Курсы» (пара языков known → learning).
 */
@Injectable({ providedIn: 'root' })
export class CourseTabDraftsStore {
  #state = signal<CourseTabDraftsState>({ ...initialCourseTabDraftsState });

  /** Черновик известного языка. */
  get knownLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().knownLanguageDraft);
  }

  /** Черновик изучаемого языка. */
  get learningLanguageDraft(): Signal<ContentLanguage> {
    return computed(() => this.#state().learningLanguageDraft);
  }

  /** Одинаковы ли языки (невалидная пара). */
  readonly languagePairInvalid = computed(
    () => this.#state().knownLanguageDraft === this.#state().learningLanguageDraft,
  );

  setKnownLanguageDraft(lang: ContentLanguage): void {
    this.#state.update((s) => ({ ...s, knownLanguageDraft: lang }));
  }

  setLearningLanguageDraft(lang: ContentLanguage): void {
    this.#state.update((s) => ({ ...s, learningLanguageDraft: lang }));
  }
}