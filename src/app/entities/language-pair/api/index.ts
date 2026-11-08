// ===== Types =====
export type { LanguagePairDto } from './language-pairs-api.types';
export type { LanguageDto } from './language-dto.types';

// ===== Services =====
// ⚠️ LanguagePairsApiService migrated to orval-generated client
export { LanguagePairsApiService as LanguagePairsApiServiceGenerated } from './language-pairs-api.generated';
export { LanguageApiService as LanguageApiServiceGenerated } from './language-api.generated';
export type { LanguageCreatePayload, LanguageUpdatePayload } from './language-api.generated';

// ===== Services (legacy) =====
export { LanguageApiService } from './language-api.service';
export { LanguagePairsApiService } from './language-pairs-api.service';

// ===== Mock =====
export { languagePairsApiMockInterceptor } from './mock/language-pairs-api.mock.interceptor';
export { languagesApiMockInterceptor } from './mock/languages-api.mock.interceptor';
