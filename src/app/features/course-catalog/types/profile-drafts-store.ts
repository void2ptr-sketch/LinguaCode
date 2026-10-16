import type { AppColorScheme, UserPreferences } from '../../../entities/user/model';
import type { LearningProficiencyLevel } from '../../../entities/learning/model';

/**
 * Состояние черновиков профиля пользователя (форма настроек).
 *
 * Черновики живут в отдельном сторе, чтобы не смешивать UI-состояние
 * профиля с состоянием каталога курсов.
 */
export type ProfileDraftsState = {
  nameDraft: string;
  learningProficiencyDraft: LearningProficiencyLevel;
  themeDraft: AppColorScheme;
  fontSizeDraft: UserPreferences['fontSize'];
  colorSchemeDraft: AppColorScheme;
  cardFocusFullscreenDraft: boolean;
};

export const initialProfileDraftsState: ProfileDraftsState = {
  nameDraft: '',
  learningProficiencyDraft: 'beginner',
  themeDraft: 'light',
  fontSizeDraft: 'md',
  colorSchemeDraft: 'light',
  cardFocusFullscreenDraft: false,
};