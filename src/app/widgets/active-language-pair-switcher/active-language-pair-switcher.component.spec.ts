import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ActiveLanguagePairSwitcherComponent } from './active-language-pair-switcher.component';
import { UserStore } from '../../entities/user/model/user.store';
import type { UserLanguagePairEntry } from '../../entities/user/model';

describe('ActiveLanguagePairSwitcherComponent', () => {
  let fixture: ComponentFixture<ActiveLanguagePairSwitcherComponent>;
  let component: ActiveLanguagePairSwitcherComponent;
  let userStore: UserStore;

  const mockPairs: UserLanguagePairEntry[] = [
    {
      id: 'pair-1',
      pair: { known: 'ru', learning: 'en' },
      createdAt: '2024-01-01T00:00:00.000Z',
      settings: {},
    },
    {
      id: 'pair-2',
      pair: { known: 'en', learning: 'zh' },
      createdAt: '2024-01-02T00:00:00.000Z',
      settings: {},
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ActiveLanguagePairSwitcherComponent,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
      ],
      providers: [
        UserStore,
        {
          provide: UserStore,
          useValue: {
            languagePairs: vi.fn(() => mockPairs),
            activeLanguagePairId: vi.fn(() => 'pair-1'),
            formatEntryLabel: vi.fn(
              (entry: UserLanguagePairEntry) => `${entry.pair.known} → ${entry.pair.learning}`,
            ),
            setActiveLanguagePair: vi.fn(),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ActiveLanguagePairSwitcherComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have compact input', () => {
    expect(component.compact()).toBe(false);
  });

  it('should have languagePairs signal', () => {
    expect(component.languagePairs).toBeDefined();
  });

  it('should have activeLanguagePairId signal', () => {
    expect(component.activeLanguagePairId).toBeDefined();
  });

  it('should have entryLabel method', () => {
    expect(component.entryLabel).toBeDefined();
    expect(typeof component.entryLabel).toBe('function');
  });

  it('should have onActiveChange method', () => {
    expect(component.onActiveChange).toBeDefined();
    expect(typeof component.onActiveChange).toBe('function');
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-form-field, p')).toBeTruthy();
  });

  it('should return a formatted label for a language pair entry', () => {
    const entry = mockPairs[0];
    const label = component.entryLabel(entry);
    expect(typeof label).toBe('string');
    expect(label).toBeTruthy();
  });

  it('should call userStore.setActiveLanguagePair when onActiveChange is called', () => {
    component.onActiveChange('pair-2');
    expect(userStore.setActiveLanguagePair).toHaveBeenCalledWith('pair-2');
  });

  it('should render form-field when more than one pair exists', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('mat-form-field')).toBeTruthy();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
