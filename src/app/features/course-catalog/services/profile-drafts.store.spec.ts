import { TestBed } from '@angular/core/testing';
import { ProfileDraftsStore } from './profile-drafts.store';

describe('ProfileDraftsStore', () => {
  let store: ProfileDraftsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ProfileDraftsStore);
  });

  it('should have default draft values', () => {
    expect(store.nameDraft()).toBe('');
    expect(store.learningProficiencyDraft()).toBe('beginner');
    expect(store.themeDraft()).toBe('light');
    expect(store.fontSizeDraft()).toBe('md');
    expect(store.colorSchemeDraft()).toBe('light');
    expect(store.cardFocusFullscreenDraft()).toBe(false);
  });

  it('should set nameDraft', () => {
    store.setNameDraft('Alex');
    expect(store.nameDraft()).toBe('Alex');
  });

  it('should set learningProficiencyDraft', () => {
    store.setLearningProficiencyDraft('advanced');
    expect(store.learningProficiencyDraft()).toBe('advanced');
  });

  it('should set themeDraft', () => {
    store.setThemeDraft('dark');
    expect(store.themeDraft()).toBe('dark');
  });

  it('should set fontSizeDraft', () => {
    store.setFontSizeDraft('lg');
    expect(store.fontSizeDraft()).toBe('lg');
  });

  it('should set colorSchemeDraft', () => {
    store.setColorSchemeDraft('dark');
    expect(store.colorSchemeDraft()).toBe('dark');
  });

  it('should set cardFocusFullscreenDraft', () => {
    store.setCardFocusFullscreenDraft(true);
    expect(store.cardFocusFullscreenDraft()).toBe(true);
  });

  it('should initialize all drafts from preferences', () => {
    store.initializeFromPreferences('John', 'intermediate', 'dark', 'lg', 'dark', true);

    expect(store.nameDraft()).toBe('John');
    expect(store.learningProficiencyDraft()).toBe('intermediate');
    expect(store.themeDraft()).toBe('dark');
    expect(store.fontSizeDraft()).toBe('lg');
    expect(store.colorSchemeDraft()).toBe('dark');
    expect(store.cardFocusFullscreenDraft()).toBe(true);
  });
});