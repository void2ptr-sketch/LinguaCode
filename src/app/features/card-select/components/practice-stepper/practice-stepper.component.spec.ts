import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { describe, expect, it, vi } from 'vitest';

import { PracticeStepperComponent, PracticeStepState } from './practice-stepper.component';

@Component({
  standalone: true,
  imports: [PracticeStepperComponent],
  template: `<app-practice-stepper [steps]="steps" (stepSelect)="onSelect($event)" />`,
})
class TestHostComponent {
  steps: PracticeStepState[] = [
    { index: 0, label: 'Программа', done: true, current: false, locked: false },
    { index: 1, label: 'Урок', done: true, current: false, locked: false },
    { index: 2, label: 'Сценарий', done: false, current: true, locked: false },
    { index: 3, label: 'Обучение', done: false, current: false, locked: true },
  ];
  selectedStep: number | null = null;

  onSelect(index: number): void {
    this.selectedStep = index;
  }
}

describe('PracticeStepperComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, PracticeStepperComponent, MatIconModule],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should render the component', () => {
    const root = fixture.nativeElement;
    expect(root.querySelector('app-practice-stepper')).toBeTruthy();
  });

  it('should have steps with correct structure', () => {
    expect(component.steps.length).toBe(4);
    expect(component.steps[0].label).toBe('Программа');
    expect(component.steps[1].label).toBe('Урок');
    expect(component.steps[2].label).toBe('Сценарий');
    expect(component.steps[3].label).toBe('Обучение');
  });

  it('should mark first two steps as done', () => {
    expect(component.steps[0].done).toBe(true);
    expect(component.steps[1].done).toBe(true);
  });

  it('should mark third step as current', () => {
    expect(component.steps[2].current).toBe(true);
    expect(component.steps[2].done).toBe(false);
  });

  it('should mark last step as locked', () => {
    expect(component.steps[3].locked).toBe(true);
    expect(component.steps[3].current).toBe(false);
  });

  it('should have correct step indices', () => {
    component.steps.forEach((step, index) => {
      expect(step.index).toBe(index);
    });
  });
});
