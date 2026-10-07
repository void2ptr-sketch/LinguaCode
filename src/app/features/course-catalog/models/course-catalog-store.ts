import type {
  AppColorScheme,
  ContentLanguage,
  CourseIndexEntry,
  LearningProficiencyLevel,
  RomanizationSystem,
  ToneColorSchemeId,
  UserPreferences,
} from '../../../core/models';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../core/models/phonetic-content.types';
import type { AnswerDisplayMode } from '../../../shared/components/course-display-settings-matrix/course-display-settings-matrix.utils';

export type CourseCatalogState = {
  // Course catalog data
  items: readonly CourseIndexEntry[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  progressByCourseId: Readonly<Record<string, number>>;
  completedCourseIds: ReadonlySet<string>;

  // Profile drafts
  nameDraft: string;
  learningProficiencyDraft: LearningProficiencyLevel;
  themeDraft: AppColorScheme;
  fontSizeDraft: UserPreferences['fontSize'];
  colorSchemeDraft: AppColorScheme;
  cardFocusFullscreenDraft: boolean;

  // Course tab
  knownLanguageDraft: ContentLanguage;
  learningLanguageDraft: ContentLanguage;

  // Settings tab
  settingsPairIdDraft: string;
  displayRomanizationsDraft: readonly RomanizationSystem[];
  answerRomanizationsDraft: readonly RomanizationSystem[];
  showIpaDraft: boolean;
  ipaVariantLabelDraft: string;
  answerModesDraft: readonly AnswerDisplayMode[];
  toneColorEnabledDraft: boolean;
  toneColorSchemeDraft: ToneColorSchemeId;
  tracingStrokeDurationDraft: number;

  // Tab control
  selectedTabIndex: number;
};

export const initialState: CourseCatalogState = {
  // Course catalog data
  items: [],
  totalItems: 0,
  pageIndex: 0,
  pageSize: 10,
  loading: false,
  error: null,
  progressByCourseId: {},
  completedCourseIds: new Set(),

  // Profile drafts
  nameDraft: '',
  learningProficiencyDraft: 'beginner' as LearningProficiencyLevel,
  themeDraft: 'azure-blue' as AppColorScheme,
  fontSizeDraft: 'md',
  colorSchemeDraft: 'light' as AppColorScheme,
  cardFocusFullscreenDraft: false,

  // Course tab
  knownLanguageDraft: 'ru' as ContentLanguage,
  learningLanguageDraft: 'en' as ContentLanguage,

  // Settings tab
  settingsPairIdDraft: '',
  displayRomanizationsDraft: ['pinyin'] as readonly RomanizationSystem[],
  answerRomanizationsDraft: ['pinyin', 'palladius'] as readonly RomanizationSystem[],
  showIpaDraft: false,
  ipaVariantLabelDraft: '',
  answerModesDraft: ['orthography'] as readonly AnswerDisplayMode[],
  toneColorEnabledDraft: false,
  toneColorSchemeDraft: 'classic' as ToneColorSchemeId,
  tracingStrokeDurationDraft: TRACING_STROKE_DURATION_BOUNDS.defaultSec,

  // Tab control
  selectedTabIndex: 0,
};
