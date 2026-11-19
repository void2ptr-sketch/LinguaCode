import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { LessonFormComponent } from './lesson-form.component';
import { AppSettingsService } from '../../../../shared/api/app-settings.service';
import type { LessonFormDraft } from '../../types';
import type { Lesson } from '../../../../entities/course/model/lesson.types';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import type { ProgramWithLessons } from '../../../../entities/program/model';
import type { CourseIndexEntry } from '../../../../entities/course/model';

@Component({
  standalone: true,
  imports: [LessonFormComponent],
  template: `<app-lesson-form
    [draft]="draft.value"
    [candidateLessons]="candidateLessons.value"
    [readOnly]="readOnly.value"
    [languagePairs]="languagePairs.value"
    [courses]="courses.value"
    [programs]="programs.value"
    (draftChange)="onDraftChange($event)"
  />`,
})
class TestHostComponent {
  draft = { value: {} as LessonFormDraft };
  candidateLessons = { value: [] as readonly Lesson[] };
  readOnly = { value: false };
  languagePairs = { value: [] as readonly LanguagePairDto[] };
  courses = { value: [] as readonly CourseIndexEntry[] };
  programs = { value: [] as readonly ProgramWithLessons[] };
  onDraftChange = (_draft: LessonFormDraft): void => { void _draft; /* no-op */ };
}

describe('LessonFormComponent', () => {
  let component: LessonFormComponent;
  let host: TestHostComponent;

  const baseDraft: LessonFormDraft = {
    title: 'Test Lesson',
    description: 'Test description',
    order: 1,
    prerequisiteLessonIds: [],
    languagePairId: 1,
    courseId: 'course-1',
    programId: 'program-1',
    published: false,
    requiredTier: 'FREE',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: AppSettingsService,
          useValue: {
            maxTitleLength: () => 200,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.draft.value = baseDraft;
    fixture.detectChanges();
    component = fixture.debugElement.children[0].injector.get(LessonFormComponent);
  });

  // ── Inputs ──────────────────────────────────────────────────────────────

  it('should expose hierarchyLevels', () => {
    expect(component.hierarchyLevels).toEqual(['languagePair', 'course', 'program']);
  });

  it('should expose tierOptions and tierLabels', () => {
    expect(component.tierOptions).toEqual(['FREE', 'STARTER', 'GROWTH', 'PREMIUM']);
    expect(component.tierLabels['FREE']).toBe('Бесплатный');
    expect(component.tierLabels['PREMIUM']).toBe('Премиум');
  });

  it('should expose titleMaxLength from app settings', () => {
    expect(component.titleMaxLength).toBe(200);
  });

  // ── Computed hierarchyValue ─────────────────────────────────────────────

  it('should derive hierarchyValue from draft', () => {
    const value = component.hierarchyValue();
    expect(value).toEqual({
      languagePairId: 1,
      courseId: 'course-1',
      programId: 'program-1',
    });
  });

  // Note: input.required cannot be mutated after creation, so we only test
  // the happy path for hierarchyValue in the beforeEach setup.

  // ── Input defaults ──────────────────────────────────────────────────────

  it('should default candidateLessons to empty array', () => {
    expect(component.candidateLessons()).toEqual([]);
  });

  it('should default readOnly to false', () => {
    expect(component.readOnly()).toBe(false);
  });

  it('should default languagePairs to empty array', () => {
    expect(component.languagePairs()).toEqual([]);
  });

  it('should default courses to empty array', () => {
    expect(component.courses()).toEqual([]);
  });

  it('should default programs to empty array', () => {
    expect(component.programs()).toEqual([]);
  });

  // ── updateTitle ─────────────────────────────────────────────────────────

  it('should emit updated draft with new title', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateTitle('New Title');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].title).toBe('New Title');
    expect(emitted[0].description).toBe('Test description');
  });

  // ── updateDescription ───────────────────────────────────────────────────

  it('should emit updated draft with new description', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateDescription('New description');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].description).toBe('New description');
  });

  // ── updateOrder ─────────────────────────────────────────────────────────

  it('should emit updated draft with numeric order', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateOrder('5');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].order).toBe(5);
  });

  it('should handle zero order', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateOrder('0');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].order).toBe(0);
  });

  // ── updatePrerequisiteLessonIds ─────────────────────────────────────────

  it('should emit updated draft with prerequisite lesson ids', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updatePrerequisiteLessonIds(['lesson-1', 'lesson-2']);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].prerequisiteLessonIds).toEqual(['lesson-1', 'lesson-2']);
  });

  it('should emit updated draft with empty prerequisite lesson ids', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updatePrerequisiteLessonIds([]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].prerequisiteLessonIds).toEqual([]);
  });

  // ── updatePublished ─────────────────────────────────────────────────────

  it('should emit updated draft with published true', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updatePublished(true);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].published).toBe(true);
  });

  it('should emit updated draft with published false', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updatePublished(false);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].published).toBe(false);
  });

  // ── updateRequiredTier ──────────────────────────────────────────────────

  it('should emit updated draft with tier', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateRequiredTier('PREMIUM');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].requiredTier).toBe('PREMIUM');
  });

  it('should emit updated draft with undefined tier when null', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.updateRequiredTier(null);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].requiredTier).toBeUndefined();
  });

  // ── onLanguagePairChange ────────────────────────────────────────────────

  it('should emit updated draft with language pair id', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onLanguagePairChange(42);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].languagePairId).toBe(42);
  });

  it('should emit updated draft with undefined language pair id when null', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onLanguagePairChange(null);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].languagePairId).toBeUndefined();
  });

  // ── onHierarchyChange ───────────────────────────────────────────────────

  it('should emit updated draft with hierarchy values', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onHierarchyChange({
      languagePairId: 10,
      courseId: 'course-10',
      programId: 'program-10',
    });

    expect(emitted).toHaveLength(1);
    expect(emitted[0].languagePairId).toBe(10);
    expect(emitted[0].courseId).toBe('course-10');
    expect(emitted[0].programId).toBe('program-10');
  });

  it('should handle undefined hierarchy values', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onHierarchyChange({
      languagePairId: undefined,
      courseId: '',
      programId: '',
    });

    expect(emitted).toHaveLength(1);
    expect(emitted[0].languagePairId).toBeUndefined();
    expect(emitted[0].courseId).toBe('');
    expect(emitted[0].programId).toBe('');
  });

  // ── onCourseIdChange ────────────────────────────────────────────────────

  it('should emit updated draft with course id', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onCourseIdChange('new-course');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].courseId).toBe('new-course');
  });

  it('should emit updated draft with undefined course id when null', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onCourseIdChange(null);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].courseId).toBeUndefined();
  });

  // ── onProgramIdChange ───────────────────────────────────────────────────

  it('should emit updated draft with program id', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onProgramIdChange('new-program');

    expect(emitted).toHaveLength(1);
    expect(emitted[0].programId).toBe('new-program');
  });

  it('should emit updated draft with empty program id when null', () => {
    const emitted = [] as LessonFormDraft[];
    component.draftChange.subscribe((d) => emitted.push(d));

    component.onProgramIdChange(null);

    expect(emitted).toHaveLength(1);
    expect(emitted[0].programId).toBe('');
  });
});
