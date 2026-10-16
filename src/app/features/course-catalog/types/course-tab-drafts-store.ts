import type { ContentLanguage } from '../../../entities/card/model';

/**
 * Состояние черновиков вкладки «Курсы» (пара языков known → learning).
 */
export type CourseTabDraftsState = {
  knownLanguageDraft: ContentLanguage;
  learningLanguageDraft: ContentLanguage;
};

export const initialCourseTabDraftsState: CourseTabDraftsState = {
  knownLanguageDraft: 'ru',
  learningLanguageDraft: 'en',
};