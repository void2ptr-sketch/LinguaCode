import type { RomanizationSystem, ToneColorSchemeId } from '../../../entities/phonetic/model';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../entities/phonetic/model';
import type { AnswerDisplayMode } from '../../../entities/course/ui/course-display-settings-matrix/course-display-settings-matrix.util';

/**
 * Состояние черновиков вкладки «Настройки» (отображение курса).
 *
 * Черновики инициализируются из `UserLanguagePairSettings` активной пары
 * и персистятся обратно через `UserStore.updateLanguagePairSettings()`.
 */
export type SettingsDraftsState = {
  settingsPairIdDraft: string;
  displayRomanizationsDraft: readonly RomanizationSystem[];
  answerRomanizationsDraft: readonly RomanizationSystem[];
  showIpaDraft: boolean;
  ipaVariantLabelDraft: string;
  answerModesDraft: readonly AnswerDisplayMode[];
  toneColorEnabledDraft: boolean;
  toneColorSchemeDraft: ToneColorSchemeId;
  tracingStrokeDurationDraft: number;
};

export const initialSettingsDraftsState: SettingsDraftsState = {
  settingsPairIdDraft: '',
  displayRomanizationsDraft: ['pinyin'],
  answerRomanizationsDraft: ['pinyin', 'palladius'],
  showIpaDraft: false,
  ipaVariantLabelDraft: '',
  answerModesDraft: ['orthography'],
  toneColorEnabledDraft: false,
  toneColorSchemeDraft: 'classic',
  tracingStrokeDurationDraft: TRACING_STROKE_DURATION_BOUNDS.defaultSec,
};