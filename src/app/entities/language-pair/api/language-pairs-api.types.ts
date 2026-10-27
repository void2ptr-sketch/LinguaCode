/**
 * DTO for a language pair returned from the backend.
 *
 * @remarks
 * Used by `LanguagePairsApiService` to map `languagePairId` to
 * `{ known, learning }` when processing course/program/scenario indices.
 */
export type LanguagePairDto = {
  /** Numeric ID of the language pair (matches `CourseDto.languagePairId`). */
  id: number;
  /** Known (source) language code, e.g. `'ru'`, `'en'`, `'zh'`. */
  knownCode: string;
  /** Learning (target) language code, e.g. `'ru'`, `'en'`, `'zh'`. */
  learningCode: string;
};
