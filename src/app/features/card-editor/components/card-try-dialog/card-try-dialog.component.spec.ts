import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { describe, expect, it, vi } from 'vitest';

import { CardTryDialogComponent } from './card-try-dialog.component';
import { CardsApiService } from '../../../../core/repositories/cards/api/cards-api.service';
import { CardsCatalogMockHandler } from '../../../../core/api/cards/cards-catalog.mock.handler';
import { UserStore } from '../../../../core/state';
import { SingleCardPlayStore } from './single-card-play.store';
import { cardsApiMockInterceptor } from '../../../../core/api/cards/cards-api.mock.interceptor';

// Mock CardHostComponent to avoid deep dependency chain
@Component({
  selector: 'app-card-host',
  standalone: true,
  imports: [],
  template: '<div class="card-host-mock"><ng-content /></div>',
})
class MockCardHostComponent {}

describe('CardTryDialogComponent', () => {
  let fixture: ComponentFixture<CardTryDialogComponent>;
  let component: CardTryDialogComponent;

  const mockCardData = {
    id: 'select-1',
    kind: 'select',
    title: 'Test Card',
    direction: 'known-to-learning' as const,
    promptKnown: 'Test prompt',
    optionsKnown: ['A', 'B'],
    optionsLearning: ['А', 'Б'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  };

  beforeEach(async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {
      /* silence console.error in tests */
    });

    await TestBed.configureTestingModule({
      imports: [
        CardTryDialogComponent,
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        MockCardHostComponent,
      ],
      providers: [
        CardsApiService,
        CardsCatalogMockHandler,
        UserStore,
        SingleCardPlayStore,
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { cardId: 'select-1' } },
        provideHttpClient(withInterceptors([cardsApiMockInterceptor])),
      ],
    }).overrideComponent(CardTryDialogComponent, {
      set: {
        imports: [
          FormsModule,
          MatButtonModule,
          MatButtonToggleModule,
          MatDialogModule,
          MatProgressSpinnerModule,
          MockCardHostComponent,
        ],
      },
    }).compileComponents();

    fixture = TestBed.createComponent(CardTryDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have MatDialogRef injected (private)', () => {
    expect(component.close).toBeDefined();
  });

  it('should have SingleCardPlayStore injected', () => {
    expect(component.playStore).toBeDefined();
  });

  it('should have kindLabels', () => {
    expect(component.kindLabels).toBeDefined();
  });

  it('should have fontSize computed from user preferences', () => {
    expect(component.fontSize()).toBeDefined();
  });

  it('should have title computed', () => {
    expect(component.title).toBeDefined();
  });

  it('should have close method', () => {
    expect(component.close).toBeDefined();
    expect(typeof component.close).toBe('function');
  });

  it('should have onDirectionChange method', () => {
    expect(component.onDirectionChange).toBeDefined();
    expect(typeof component.onDirectionChange).toBe('function');
  });

  it('should have checkAnswer method', () => {
    expect(component.checkAnswer).toBeDefined();
    expect(typeof component.checkAnswer).toBe('function');
  });

  it('should render the component', () => {
    fixture.detectChanges();
    const root = fixture.nativeElement;
    expect(root.innerHTML).toBeTruthy();
  });
});
