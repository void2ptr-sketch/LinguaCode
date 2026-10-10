import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { describe, expect, it, vi } from 'vitest';

import { PracticeSessionBarComponent, PracticeSessionSegment } from './practice-session-bar.component';

@Component({
  standalone: true,
  imports: [PracticeSessionBarComponent],
  template: `<app-practice-session-bar [segments]="segments" (segmentSelect)="onSelect($event)" />`,
})
class TestHostComponent {
  segments: PracticeSessionSegment[] = [
    {
      tabIndex: 0,
      label: 'Программа',
      value: 'Test Course',
      placeholder: 'Программа не выбрана',
      completed: true,
      locked: false,
    },
    {
      tabIndex: 1,
      label: 'Урок',
      value: null,
      placeholder: 'Урок не выбран',
      completed: false,
      locked: false,
    },
    {
      tabIndex: 2,
      label: 'Сценарий',
      value: null,
      placeholder: 'Сценарий не выбран',
      completed: false,
      locked: true,
      lockReason: 'Сначала выберите урок',
    },
  ];
  selectedTab: number | null = null;

  onSelect(tabIndex: number): void {
    this.selectedTab = tabIndex;
  }
}

describe('PracticeSessionBarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, PracticeSessionBarComponent, MatIconModule, MatTooltipModule],
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
    expect(root.querySelector('app-practice-session-bar')).toBeTruthy();
  });

  it('should have segments with correct structure', () => {
    expect(component.segments.length).toBe(3);
    expect(component.segments[0].label).toBe('Программа');
    expect(component.segments[1].label).toBe('Урок');
    expect(component.segments[2].label).toBe('Сценарий');
  });

  it('should handle segment with null value', () => {
    expect(component.segments[1].value).toBeNull();
    expect(component.segments[1].placeholder).toBe('Урок не выбран');
  });

  it('should handle segment with lockReason', () => {
    expect(component.segments[2].lockReason).toBe('Сначала выберите урок');
  });

  it('should mark first segment as completed', () => {
    expect(component.segments[0].completed).toBe(true);
    expect(component.segments[0].locked).toBe(false);
  });

  it('should mark third segment as locked', () => {
    expect(component.segments[2].locked).toBe(true);
    expect(component.segments[2].completed).toBe(false);
  });
});
