import { TestBed } from '@angular/core/testing';
import { SettingsDraftsStore } from './settings-drafts.store';

describe('SettingsDraftsStore', () => {
  let store: SettingsDraftsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SettingsDraftsStore);
  });

  it('should have default draft values', () => {
    expect(store.settingsPairIdDraft()).toBe('');
    expect(store.displayRomanizationsDraft()).toEqual(['pinyin']);
    expect(store.answerRomanizationsDraft()).toEqual(['pinyin', 'palladius']);
    expect(store.showIpaDraft()).toBe(false);
    expect(store.ipaVariantLabelDraft()).toBe('');
    expect(store.answerModesDraft()).toEqual(['orthography']);
    expect(store.toneColorEnabledDraft()).toBe(false);
    expect(store.toneColorSchemeDraft()).toBe('classic');
    expect(store.tracingStrokeDurationDraft()).toBeGreaterThan(0);
  });

  it('should set settingsPairIdDraft', () => {
    store.setSettingsPairIdDraft('pair-123');
    expect(store.settingsPairIdDraft()).toBe('pair-123');
  });

  it('should set displayRomanizationsDraft', () => {
    store.setDisplayRomanizationsDraft(['palladius']);
    expect(store.displayRomanizationsDraft()).toEqual(['palladius']);
  });

  it('should set answerRomanizationsDraft', () => {
    store.setAnswerRomanizationsDraft(['pinyin']);
    expect(store.answerRomanizationsDraft()).toEqual(['pinyin']);
  });

  it('should set showIpaDraft', () => {
    store.setShowIpaDraft(true);
    expect(store.showIpaDraft()).toBe(true);
  });

  it('should set ipaVariantLabelDraft', () => {
    store.setIpaVariantLabelDraft('BrE');
    expect(store.ipaVariantLabelDraft()).toBe('BrE');
  });

  it('should set answerModesDraft', () => {
    store.setAnswerModesDraft(['orthography', 'ipa']);
    expect(store.answerModesDraft()).toEqual(['orthography', 'ipa']);
  });

  it('should set toneColorEnabledDraft', () => {
    store.setToneColorEnabledDraft(true);
    expect(store.toneColorEnabledDraft()).toBe(true);
  });

  it('should set toneColorSchemeDraft', () => {
    store.setToneColorSchemeDraft('warm');
    expect(store.toneColorSchemeDraft()).toBe('warm');
  });

  it('should set tracingStrokeDurationDraft', () => {
    store.setTracingStrokeDurationDraft(1.5);
    expect(store.tracingStrokeDurationDraft()).toBe(1.5);
  });

  it('should initialize all drafts from preferences', () => {
    store.initializeFromPreferences(
      'pair-456',
      ['palladius'],
      ['pinyin'],
      true,
      'AmE',
      ['orthography', 'ipa'],
      true,
      'warm',
      1.2,
    );

    expect(store.settingsPairIdDraft()).toBe('pair-456');
    expect(store.displayRomanizationsDraft()).toEqual(['palladius']);
    expect(store.answerRomanizationsDraft()).toEqual(['pinyin']);
    expect(store.showIpaDraft()).toBe(true);
    expect(store.ipaVariantLabelDraft()).toBe('AmE');
    expect(store.answerModesDraft()).toEqual(['orthography', 'ipa']);
    expect(store.toneColorEnabledDraft()).toBe(true);
    expect(store.toneColorSchemeDraft()).toBe('warm');
    expect(store.tracingStrokeDurationDraft()).toBe(1.2);
  });

  it('should not mutate input arrays', () => {
    const inputRomanizations = ['pinyin'] as const;

    store.initializeFromPreferences(
      'pair-1',
      inputRomanizations,
      ['palladius'],
      false,
      '',
      ['orthography'],
      false,
      'classic',
      0.5,
    );

    const internal = store.displayRomanizationsDraft();
    (internal as string[]).push('zhuyin');

    expect(inputRomanizations).not.toContain('zhuyin');
  });
});