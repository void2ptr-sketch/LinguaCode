import { TestBed } from '@angular/core/testing';
import { CourseTabDraftsStore } from './course-tab-drafts.store';

describe('CourseTabDraftsStore', () => {
  let store: CourseTabDraftsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CourseTabDraftsStore);
  });

  it('should have default draft values', () => {
    expect(store.knownLanguageDraft()).toBe('ru');
    expect(store.learningLanguageDraft()).toBe('en');
  });

  it('should set knownLanguageDraft', () => {
    store.setKnownLanguageDraft('en');
    expect(store.knownLanguageDraft()).toBe('en');
  });

  it('should set learningLanguageDraft', () => {
    store.setLearningLanguageDraft('zh');
    expect(store.learningLanguageDraft()).toBe('zh');
  });

  it('should return false for languagePairInvalid when languages differ', () => {
    expect(store.languagePairInvalid()).toBe(false);
  });

  it('should return true for languagePairInvalid when languages are equal', () => {
    store.setKnownLanguageDraft('en');
    store.setLearningLanguageDraft('en');
    expect(store.languagePairInvalid()).toBe(true);
  });

  it('should reset languagePairInvalid when languages differ again', () => {
    store.setKnownLanguageDraft('en');
    store.setLearningLanguageDraft('en');
    expect(store.languagePairInvalid()).toBe(true);

    store.setKnownLanguageDraft('ru');
    expect(store.languagePairInvalid()).toBe(false);
  });
});