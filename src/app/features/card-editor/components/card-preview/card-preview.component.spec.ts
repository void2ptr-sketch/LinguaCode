import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CardPreviewComponent } from './card-preview.component';
import { CardHostComponent } from '../../../../shared/ui/card-host';
import type { Card } from '../../../../core/models';

@Component({
  standalone: true,
  imports: [CardPreviewComponent],
  template: `<app-card-preview [card]="card" [fontSize]="fontSize" />`,
})
class TestHostComponent {
  card: Card = {
    id: 'preview-1',
    kind: 'select',
    title: 'Preview Card',
    direction: 'known-to-learning',
    promptKnown: 'Test prompt',
    optionsKnown: ['A', 'B'],
    optionsLearning: ['А', 'Б'],
    correctIndex: 0,
    appearance: { theme: 'azure-blue', fontSize: 'md' },
  };
  fontSize: 'sm' | 'md' | 'lg' = 'md';
}

describe('CardPreviewComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, CardPreviewComponent, CardHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render CardHostComponent', () => {
    const host = fixture.nativeElement.querySelector('app-card-host');
    expect(host).toBeTruthy();
  });

  it('should render with required card input', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-card-host')).toBeTruthy();
  });

  it('should have default fontSize', () => {
    expect(fixture.componentInstance.fontSize).toBe('md');
  });

  it('should accept custom fontSize', () => {
    fixture.componentInstance.fontSize = 'lg';
    fixture.detectChanges();
    expect(fixture.componentInstance.fontSize).toBe('lg');
  });
});
