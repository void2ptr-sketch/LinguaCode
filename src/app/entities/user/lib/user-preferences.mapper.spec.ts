import { describe, expect, it } from 'vitest';

import type { UserLanguagePairEntry } from '../model/user-language-pair.types';
import {
  buildPreferencesPayload,
  toBackendCjkLearningSettings,
  toBackendLanguagePairSettings,
  toBackendLearningSessionSettings,
  toBackendPhoneticSettings,
} from './user-preferences.mapper';

describe('toBackendPhoneticSettings', () => {
  it('returns undefined when no phonetic settings exist', () => {
    expect(toBackendPhoneticSettings(undefined)).toBeUndefined();
  });

  it('uppercases frontend answer modes to the backend enum', () => {
    const result = toBackendPhoneticSettings({
      showIpa: true,
      answerModes: ['orthography', 'ipa'],
    });
    expect(result).toEqual({ showIpa: true, answerModes: ['ORTHOGRAPHY', 'IPA'] });
  });

  it('falls back to uppercase passthrough for unknown modes (legacy data)', () => {
    const result = toBackendPhoneticSettings({
      showIpa: false,
      // Legacy persisted profiles may contain modes outside the current union.
      answerModes: ['audio'] as unknown as ('orthography' | 'ipa')[],
    });
    expect(result?.answerModes).toEqual(['AUDIO']);
  });
});

describe('toBackendCjkLearningSettings', () => {
  it('returns undefined when no CJK settings exist', () => {
    expect(toBackendCjkLearningSettings(undefined)).toBeUndefined();
  });

  it('copies readonly arrays into mutable backend arrays', () => {
    const result = toBackendCjkLearningSettings({
      displayRomanizations: ['pinyin'],
      answerRomanization: ['pinyin', 'palladius'],
      showTones: true,
      toneColorScheme: 'classic',
      tracingStrokeDurationSec: 1,
    });
    expect(result).toEqual({
      displayRomanizations: ['pinyin'],
      answerRomanization: ['pinyin', 'palladius'],
      showTones: true,
      toneColorScheme: 'classic',
      tracingStrokeDurationSec: 1,
    });
  });
});

describe('toBackendLearningSessionSettings', () => {
  it('returns undefined when no learning settings exist', () => {
    expect(toBackendLearningSessionSettings(undefined)).toBeUndefined();
  });

  it('passes the frontend session fields through', () => {
    const result = toBackendLearningSessionSettings({
      activeCourseId: 'c1',
      lastScenarioId: 's9',
    });
    expect(result).toEqual({ activeCourseId: 'c1', lastScenarioId: 's9' });
  });
});

describe('toBackendLanguagePairSettings', () => {
  it('returns undefined when no settings exist', () => {
    expect(toBackendLanguagePairSettings(undefined)).toBeUndefined();
  });

  it('nests phonetic settings under the `phonetic` key', () => {
    const result = toBackendLanguagePairSettings({
      phonetic: { showIpa: true, answerModes: ['ipa'] },
    });
    expect(result).toEqual({
      phonetic: { showIpa: true, answerModes: ['IPA'] },
      cjkLearning: undefined,
      learning: undefined,
    });
  });
});

describe('buildPreferencesPayload', () => {
  const entry = (pair: { known: string; learning: string }): UserLanguagePairEntry => ({
    id: `${pair.known}-${pair.learning}`,
    pair: { known: pair.known, learning: pair.learning } as UserLanguagePairEntry['pair'],
    createdAt: '2024-01-01T00:00:00.000Z',
  });

  it('maps font sizes to the backend cardFontSize enum', () => {
    const base = {
      theme: 'azure-blue',
      colorScheme: 'light',
      cardFocusFullscreen: false,
      learningProficiencyLevel: 'beginner',
      languagePairs: [],
      activeLanguagePairId: undefined,
      activeByMirrorGroup: {},
    } as const;

    expect(buildPreferencesPayload({ ...base, fontSize: 'sm' }).cardFontSize).toBe('SMALL');
    expect(buildPreferencesPayload({ ...base, fontSize: 'md' }).cardFontSize).toBe('MEDIUM');
    expect(buildPreferencesPayload({ ...base, fontSize: 'lg' }).cardFontSize).toBe('LARGE');
  });

  it('flattens frontend language pairs into backend learningPairs', () => {
    const payload = buildPreferencesPayload({
      theme: 'azure-blue',
      fontSize: 'md',
      colorScheme: 'light',
      cardFocusFullscreen: true,
      learningProficiencyLevel: 'beginner',
      languagePairs: [entry({ known: 'en', learning: 'ru' })],
      activeLanguagePairId: 'en-ru',
      activeByMirrorGroup: { 'en|ru': { known: 'en', learning: 'ru' } },
    });

    expect(payload.learningPairs).toEqual([
      { known: 'en', learning: 'ru', settings: undefined },
    ]);
    expect(payload.activeLanguagePairId).toBe('en-ru');
    expect(payload.activeByMirrorGroup).toEqual({ 'en|ru': { known: 'en', learning: 'ru' } });
    expect(payload.cardFocusFullscreen).toBe(true);
    expect(payload.theme).toBe('azure-blue');
    expect(payload.colorScheme).toBe('light');
  });
});
