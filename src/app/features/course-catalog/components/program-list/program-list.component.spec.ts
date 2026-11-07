import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import type { Program } from '../../../../entities/program/model';
import { ProgramsApiService } from '../../../../entities/program/api';
import { CourseCatalogProgramsComponent } from './program-list.component';

function makeProgram(
  id: string,
  title: string,
  lessonCount: number,
  description = '',
): Program {
  return {
    id,
    courseId: 'course-1',
    title,
    description,
    lessonIds: Array.from({ length: lessonCount }, (_, i) => `lesson-${i}`),
    order: 0,
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

/** Wrapper component for testing with input binding */
@Component({
  selector: 'app-test-wrapper',
  standalone: true,
  imports: [CourseCatalogProgramsComponent],
  template: `<app-course-catalog-programs [courseIds]="courseIds" (startProgram)="onStart($event)" />`,
})
class TestWrapperComponent {
  courseIds = new Set() as ReadonlySet<string>;
  onStart = vi.fn<(id: string) => void>();
}

describe('CourseCatalogProgramsComponent', () => {
  let fixture: ComponentFixture<TestWrapperComponent>;
  let component: TestWrapperComponent;
  let mockProgramsApi: { getByCourse: (courseId: string) => Promise<readonly Program[]> };

  const defaultPrograms: readonly Program[] = [
    makeProgram('p-1', 'Program 1', 5),
    makeProgram('p-2', 'Program 2', 3),
  ];

  beforeEach(async () => {
    mockProgramsApi = {
      getByCourse: vi.fn().mockResolvedValue(defaultPrograms),
    };

    await TestBed.configureTestingModule({
      imports: [CourseCatalogProgramsComponent, TestWrapperComponent],
      providers: [
        {
          provide: ProgramsApiService,
          useValue: mockProgramsApi,
        },
      ],
    });
  });

  it('should create', () => {
    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    component.courseIds = new Set(['course-1']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-course-catalog-programs')).toBeTruthy();
  });

  describe('empty state', () => {
    it('should show message when no course is selected', async () => {
      fixture = TestBed.createComponent(TestWrapperComponent);
      component = fixture.componentInstance;
      component.courseIds = new Set();
      fixture.detectChanges();
      await fixture.whenStable();

      const content = fixture.nativeElement;
      const message = content.querySelector('.course-catalog-page__message');
      expect(message).toBeTruthy();
      expect(message.textContent).toContain('Отметьте курсы');
    });
  });

  describe('programs list', () => {
    it('should display programs when loaded', async () => {
      fixture = TestBed.createComponent(TestWrapperComponent);
      component = fixture.componentInstance;
      component.courseIds = new Set(['course-1']);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const content = fixture.nativeElement;
      const titles = content.querySelectorAll('.course-catalog-page__title');
      expect(titles.length).toBe(2);
      expect(titles[0].textContent).toContain('Program 1');
      expect(titles[1].textContent).toContain('Program 2');
    });

    it('should emit startProgram when button is clicked', async () => {
      fixture = TestBed.createComponent(TestWrapperComponent);
      component = fixture.componentInstance;
      component.courseIds = new Set(['course-1']);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();

      const startBtn = fixture.nativeElement.querySelector('button[mat-flat-button]');
      expect(startBtn).toBeTruthy();
      startBtn!.click();
      fixture.detectChanges();

      expect(component.onStart).toHaveBeenCalled();
    });
  });
});
