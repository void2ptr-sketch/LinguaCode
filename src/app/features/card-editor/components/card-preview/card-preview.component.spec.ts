import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CardPreviewComponent } from './card-preview.component';
import type { Card } from '../../../../entities/card/model';

// Mock CardHostComponent to avoid deep dependency chain
@Component({
  selector: 'app-card-host',
  standalone: true,
  imports: [],
  template: '<div class="card-host-mock"><ng-content /></div>',
})
class MockCardHostComponent {
  readonly card = input.required<Card>();
  readonly fontSize = input<'sm' | 'md' | 'lg'>('md');
}

describe('CardPreviewComponent', () => {
  let fixture: ComponentFixture<CardPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardPreviewComponent],
    }).overrideComponent(CardPreviewComponent, {
      set: {
        imports: [MockCardHostComponent],
      },
    });

    fixture = TestBed.createComponent(CardPreviewComponent);
    fixture.componentRef.setInput('card', {
      id: 'preview-1',
      kind: 'select',
      title: 'Preview Card',
      direction: 'known-to-learning',
      promptKnown: 'Test prompt',
      optionsKnown: ['A', 'B'],
      optionsLearning: ['А', 'Б'],
      correctIndex: 0,
      appearance: { theme: 'azure-blue', fontSize: 'md' },
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render CardHostComponent', () => {
    const host = fixture.nativeElement.querySelector('.card-host-mock');
    expect(host).toBeTruthy();
  });

  it('should render with required card input', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('.card-host-mock')).toBeTruthy();
  });

  it('should have default fontSize', () => {
    expect(fixture.componentInstance.fontSize()).toBe('md');
  });

  it('should accept custom fontSize', () => {
    fixture.componentRef.setInput('fontSize', 'lg' as const);
    fixture.detectChanges();
    expect(fixture.componentInstance.fontSize()).toBe('lg');
  });
});
