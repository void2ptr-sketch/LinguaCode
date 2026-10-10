import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ActiveLanguagePairSwitcherComponent } from './active-language-pair-switcher.component';
import { UserStore } from '../../../../core/state';

// Mock UserStore
function createUserStoreMock() {
  return {
    languagePairs: vi.fn(() => [
      { id: 'pair-1', known: 'ru', learning: 'en' },
      { id: 'pair-2', known: 'en', learning: 'zh' },
    ]),
    activeLanguagePairId: vi.fn(() => 'pair-1'),
    formatEntryLabel: vi.fn((entry) => `${entry.known} → ${entry.learning}`),
    setActiveLanguagePair: vi.fn(),
  };
}

describe('ActiveLanguagePairSwitcherComponent', () => {
  let fixture: ComponentFixture<ActiveLanguagePairSwitcherComponent>;
  let component: ActiveLanguagePairSwitcherComponent;
  let userStoreMock: ReturnType<typeof createUserStoreMock>;

  beforeEach(() => {
    userStoreMock = createUserStoreMock();

    TestBed.configureTestingModule({
      imports: [ActiveLanguagePairSwitcherComponent, NoopAnimationsModule],
      providers: [{ provide: UserStore, useValue: userStoreMock }],
    });

    fixture = TestBed.createComponent(ActiveLanguagePairSwitcherComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeDefined();
    });

    it('should have languagePairs from user store', () => {
      fixture.detectChanges();
      expect(component.languagePairs).toBeDefined();
    });

    it('should have activeLanguagePairId from user store', () => {
      fixture.detectChanges();
      expect(component.activeLanguagePairId).toBeDefined();
    });
  });

  describe('inputs', () => {
    it('should accept compact input', () => {
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      expect(component.compact()).toBe(true);
    });

    it('should default compact to false', () => {
      fixture.detectChanges();
      expect(component.compact()).toBe(false);
    });
  });

  describe('methods', () => {
    it('should return formatted entry label', () => {
      const entry = { id: 'pair-1', known: 'ru' as const, learning: 'en' as const };
      const label = component.entryLabel(entry);
      expect(typeof label).toBe('string');
    });

    it('should call user store to set active language pair', () => {
      component.onActiveChange('pair-2');
      expect(userStoreMock.setActiveLanguagePair).toHaveBeenCalledWith('pair-2');
    });
  });
});
