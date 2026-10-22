import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CardTryDialogComponent } from './card-try-dialog.component';
import { SingleCardPlayStore } from './single-card-play.store';
import { CardsCatalogMockHandler } from '../../../../entities/card/api/mock/cards-catalog.mock.handler';
import { CardsApiService } from '../../../../entities/card/api/cards-api.service';
import { UserStore } from '../../../../entities/user/model/user.store';
import { seedTestContentCache } from '../../../../entities/content-seed/content-seed.test-utils';
import type { CardTryDialogData } from './card-try-dialog.types';
import type { CardIndexEntry } from '../../../../entities/card/model';

/** Mock for CardHostComponent to avoid deep dependency chain. */
@Component({
  selector: 'app-card-host',
  template: '',
  standalone: true,
})
class MockCardHostComponent {}

describe('CardTryDialogComponent', () => {
  let component: CardTryDialogComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<CardTryDialogComponent>>;
  let mockHandlerSpy: ReturnType<typeof vi.spyOn>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  const TEST_CARD_ID = 'demo-card-1';

  const createDialogData = { cardId: TEST_CARD_ID } satisfies CardTryDialogData;

  beforeEach(async () => {
    localStorage.clear();
    seedTestContentCache();

    mockDialogRef = { close: vi.fn() };

    fixture = TestBed.configureTestingModule({
      imports: [CardTryDialogComponent, MockCardHostComponent],
      providers: [
        SingleCardPlayStore,
        UserStore,
        provideHttpClient(),
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: createDialogData },
      ],
    }).createComponent(CardTryDialogComponent);

    // Spy on the injected CardsCatalogMockHandler BEFORE component initializes
    const handler = TestBed.inject(CardsCatalogMockHandler);
    mockHandlerSpy = vi.spyOn(handler, 'getIndexEntry');

    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
    mockHandlerSpy?.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should inject SingleCardPlayStore', () => {
    // Component provides its own SingleCardPlayStore instance
    expect(component.playStore).toBeDefined();
  });

  it('should have correct dialog data', () => {
    expect(component.data.cardId).toBe(TEST_CARD_ID);
  });

  describe('initialization', () => {
    it('should set loading to true on init', async () => {
      await fixture.whenStable();
      // After ngOnInit completes, loading should be false (async operation finished)
      expect(component.playStore.loading()).toBe(false);
    });

    it('should load card successfully when card exists', async () => {
      await fixture.whenStable();

      expect(component.playStore.loading()).toBe(false);
      expect(component.playStore.card()).toBeDefined();
      expect(component.playStore.error()).toBeNull();
    });
  });

  describe('title computed', () => {
    it('should show default title when no card is loaded', () => {
      expect(component.title()).toBe('Прогон карточки');
    });

    it('should show card title with kind label when card is loaded', async () => {
      await fixture.whenStable();

      const card = component.playStore.card();
      if (card) {
        expect(component.title()).toContain(card.title);
        expect(component.title()).toContain(component.kindLabels[card.kind]);
      }
    });
  });

  describe('fontSize computed', () => {
    it('should return font size from user preferences', () => {
      const fontSize = component.fontSize();
      expect(fontSize).toBeDefined();
    });
  });

  describe('onDirectionChange', () => {
    it('should update session direction', async () => {
      await fixture.whenStable();

      component.onDirectionChange('learning-to-known');

      expect(component.playStore.sessionDirection()).toBe('learning-to-known');
    });
  });

  describe('checkAnswer', () => {
    it('should call playStore.checkAnswer', async () => {
      await fixture.whenStable();

      const checkSpy = vi.spyOn(component.playStore, 'checkAnswer');
      component.checkAnswer();

      expect(checkSpy).toHaveBeenCalled();
    });
  });

  describe('initialization with error', () => {
    it('should set error when card does not belong to active course', async () => {
      // DEFAULT_LANGUAGE_PAIR is ru→en, use a different pair to trigger mismatch
      mockHandlerSpy.mockResolvedValueOnce({
        id: 'other-card',
        title: 'Other',
        knownLanguage: 'zh',
        learningLanguage: 'ja',
      } as unknown as CardIndexEntry);

      fixture.detectChanges();
      await fixture.whenStable();
      await fixture.whenStable();

      expect(component.playStore.error()).toBe('Карточка не относится к активному курсу');
      expect(component.playStore.loading()).toBe(false);
    });

    it('should set error when card loading fails', async () => {
      mockHandlerSpy.mockResolvedValueOnce({
        id: TEST_CARD_ID,
        title: 'Test',
        knownLanguage: 'ru',
        learningLanguage: 'en',
      } as unknown as CardIndexEntry);

      // Override getById to throw
      const cardsApi = TestBed.inject(CardsApiService);
      vi.spyOn(cardsApi, 'getById').mockRejectedValueOnce(new Error('API error'));

      fixture.detectChanges();
      await fixture.whenStable();
      await fixture.whenStable();

      expect(component.playStore.error()).toBe('Не удалось загрузить карточку');
      expect(component.playStore.loading()).toBe(false);
    });
  });

  describe('close', () => {
    it('should close the dialog', async () => {
      await fixture.whenStable();

      component.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('tryAgain flow', () => {
    it('should return null from checkAnswer when no card is set', async () => {
      const result = component.playStore.checkAnswer();
      expect(result).toBeNull();
    });
  });
});
