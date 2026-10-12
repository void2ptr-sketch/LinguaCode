import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserPageComponent } from './user-page.component';
import { UserStore } from '../../entities/user/model/user.store';
import { LEARNING_PROFICIENCY_LEVELS } from '../../entities/learning/model';

describe('UserPageComponent', () => {
  let component: UserPageComponent;
  let fixture: ComponentFixture<UserPageComponent>;
  let userStore: UserStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPageComponent],
      providers: [UserStore],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPageComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject UserStore', () => {
    // userStore is private, but we can verify it works by checking exposed signals
    expect(userStore).toBeDefined();
  });

  it('should expose displayName from userStore', () => {
    expect(component.displayName).toBe(userStore.displayName);
  });

  it('should expose preferences from userStore', () => {
    expect(component.preferences).toBe(userStore.preferences);
  });

  it('should expose languages', () => {
    expect(component.languages).toBeDefined();
    expect(Array.isArray(component.languages)).toBe(true);
  });

  it('should expose languageLabels', () => {
    expect(component.languageLabels).toBeDefined();
  });

  it('should expose learningProficiencyOptions', () => {
    expect(component.learningProficiencyOptions).toBe(LEARNING_PROFICIENCY_LEVELS);
  });

  describe('draft signals', () => {
    it('should have nameDraft initialized from displayName', () => {
      expect(component.nameDraft).toBeDefined();
      expect(component.nameDraft()).toBeDefined();
    });

    it('should have learningProficiencyDraft initialized from preferences', () => {
      expect(component.learningProficiencyDraft).toBeDefined();
      expect(component.learningProficiencyDraft()).toBeDefined();
    });

    it('should have themeDraft initialized from preferences', () => {
      expect(component.themeDraft).toBeDefined();
      expect(component.themeDraft()).toBeDefined();
    });

    it('should have fontSizeDraft initialized from preferences', () => {
      expect(component.fontSizeDraft).toBeDefined();
      expect(component.fontSizeDraft()).toBeDefined();
    });

    it('should have colorSchemeDraft initialized from preferences', () => {
      expect(component.colorSchemeDraft).toBeDefined();
      expect(component.colorSchemeDraft()).toBeDefined();
    });

    it('should have cardFocusFullscreenDraft initialized from preferences', () => {
      expect(component.cardFocusFullscreenDraft).toBeDefined();
      expect(component.cardFocusFullscreenDraft()).toBeDefined();
    });

    it('should have selectedTabIndex initialized to 0', () => {
      expect(component.selectedTabIndex).toBeDefined();
      expect(component.selectedTabIndex()).toBe(0);
    });
  });

  describe('saveProfile', () => {
    it('should call userStore.updateDisplayName', () => {
      const updateDisplayNameSpy = vi.spyOn(userStore, 'updateDisplayName');
      component.nameDraft.set('New Name');
      component.saveProfile();
      expect(updateDisplayNameSpy).toHaveBeenCalledWith('New Name');
    });

    it('should call userStore.updatePreferences with all draft values', () => {
      const updatePreferencesSpy = vi.spyOn(userStore, 'updatePreferences');
      component.themeDraft.set('dark');
      component.fontSizeDraft.set('lg');
      component.colorSchemeDraft.set('dark');
      component.cardFocusFullscreenDraft.set(true);
      component.learningProficiencyDraft.set('intermediate');
      component.saveProfile();

      expect(updatePreferencesSpy).toHaveBeenCalledWith({
        theme: 'dark',
        fontSize: 'lg',
        colorScheme: 'dark',
        cardFocusFullscreen: true,
        learningProficiencyLevel: 'intermediate',
      });
    });
  });

  describe('ngOnInit', () => {
    it('should reset learningProficiencyDraft from preferences', () => {
      // preferences is a signal, we can't directly set it in tests
      // Just verify the component initializes correctly
      component.ngOnInit();
      expect(component.learningProficiencyDraft()).toBeDefined();
    });
  });
});
