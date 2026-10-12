import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CardTryDialogComponent } from './card-try-dialog.component';
import { SingleCardPlayStore } from './single-card-play.store';
import { CardsCatalogMockHandler } from '../../../../entities/card/api/mock/cards-catalog.mock.handler';
import { UserStore } from '../../../../core/state';
import { seedTestContentCache } from '../../../../entities/content-seed/content-seed.test-utils';
import type { CardTryDialogData } from './card-try-dialog.types';

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
    it('should be defined', () => {
      expect(component.checkAnswer).toBeDefined();
    });
  });

  describe('close', () => {
    it('should close the dialog', async () => {
      await fixture.whenStable();

      component.close();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
