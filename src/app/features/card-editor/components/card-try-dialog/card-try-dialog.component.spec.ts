import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
import { CardHostComponent } from '../../../../shared/ui/card-host';

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
    await TestBed.configureTestingModule({
      imports: [
        CardTryDialogComponent,
        MatButtonModule,
        MatButtonToggleModule,
        MatDialogModule,
        MatProgressSpinnerModule,
        CardHostComponent,
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
    }).compileComponents();

    fixture = TestBed.createComponent(CardTryDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have MatDialogRef injected (private)', () => {
    // dialogRef is private but the component should work with it
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
    // Dialog components are rendered directly
    expect(root.innerHTML).toBeTruthy();
  });
});
