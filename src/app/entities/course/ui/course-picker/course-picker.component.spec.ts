import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PageEvent } from '@angular/material/paginator';
import { CoursePickerComponent } from './course-picker.component';
import { CourseSearchService } from '../../../../entities/course';
import { UserStore } from '../../../../entities/user/model/user.store';
import type { CourseIndexEntry } from '../../../../entities/course/model';

describe('CoursePickerComponent', () => {
  let component: CoursePickerComponent;
  let fixture: ComponentFixture<CoursePickerComponent>;
  let searchSpy: ReturnType<typeof vi.fn>;

  const mockCourses: CourseIndexEntry[] = [
    {
      id: 'course-1',
      title: 'Course One',
      authorId: 'user-1',
      lessonCount: 5,
      published: true,
      updatedAt: '2024-01-01',
      languagePairSummary: 'EN-RU',
    },
    {
      id: 'course-2',
      title: 'Course Two',
      authorId: 'user-1',
      lessonCount: 10,
      published: true,
      updatedAt: '2024-01-02',
      languagePairSummary: 'EN-RU',
    },
  ];

  beforeEach(async () => {
    searchSpy = vi.fn().mockResolvedValue({
      items: mockCourses,
      totalItems: 2,
      page: 0,
      pageSize: 10,
    });

    const getByIdSpy = vi.fn().mockResolvedValue(null);
    const activeLanguagePairIdSpy = vi.fn().mockReturnValue('pair-1');
    const languagePairSpy = vi.fn().mockReturnValue({ source: 'en', target: 'ru' });

    const mockSearchService = {
      search: searchSpy,
      getById: getByIdSpy,
    } as unknown as CourseSearchService;

    const mockUserStore = {
      activeLanguagePairId: activeLanguagePairIdSpy,
      languagePair: languagePairSpy,
    } as unknown as UserStore;

    await TestBed.configureTestingModule({
      imports: [CoursePickerComponent],
      providers: [
        { provide: CourseSearchService, useValue: mockSearchService },
        { provide: UserStore, useValue: mockUserStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoursePickerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedCourseId', '');
    fixture.detectChanges();
  });

  // ─── Creation & Inputs ────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required inputs with defaults', () => {
    expect(component.selectedCourseId()).toBe('');
    expect(component.selectedCourseLabel()).toBe('');
    expect(component.defaultScope()).toBe('published');
    expect(component.compact()).toBe(false);
  });

  it('should have all outputs defined', () => {
    expect(component.selectedCourseIdChange).toBeDefined();
    expect(component.courseLabelChange).toBeDefined();
  });

  // ─── Load ─────────────────────────────────────────────────────────────

  it('should load courses on init', async () => {
    expect(searchSpy).toHaveBeenCalled();
    expect(component.items()).toEqual(mockCourses);
    expect(component.totalItems()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should set loading false on error', async () => {
    searchSpy.mockRejectedValueOnce(new Error('Network error'));

    await expect(component.load()).rejects.toThrow('Network error');
    expect(component.loading()).toBe(false);
  });

  it('should reset page index on query change', () => {
    component.onQueryChange('test');
    expect(component.pageIndex()).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ query: 'test' }));
  });

  it('should reset page index on scope change', () => {
    component.onScopeChange('all');
    expect(component.pageIndex()).toBe(0);
    expect(searchSpy).toHaveBeenCalledWith(expect.objectContaining({ scope: 'all' }));
  });

  // ─── Pick ─────────────────────────────────────────────────────────────

  it('should emit selectedCourseIdChange and courseLabelChange when picking', () => {
    const emitSpy = vi.spyOn(component.selectedCourseIdChange, 'emit');
    const labelSpy = vi.spyOn(component.courseLabelChange, 'emit');

    component.pick(mockCourses[0]);
    expect(emitSpy).toHaveBeenCalledWith('course-1');
    expect(labelSpy).toHaveBeenCalledWith('Course One · 5 уроков · EN-RU');
  });

  it('should collapse full list in compact mode when picking', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    component.showFullList.set(true);
    component.pick(mockCourses[0]);

    expect(component.showFullList()).toBe(false);
  });

  it('should not collapse full list in non-compact mode when picking', () => {
    component.showFullList.set(true);
    component.pick(mockCourses[0]);

    expect(component.showFullList()).toBe(true);
  });

  // ─── Clear ────────────────────────────────────────────────────────────

  it('should clear selection', () => {
    const emitSpy = vi.spyOn(component.selectedCourseIdChange, 'emit');
    const labelSpy = vi.spyOn(component.courseLabelChange, 'emit');

    component.clearSelection();
    expect(emitSpy).toHaveBeenCalledWith('');
    expect(labelSpy).toHaveBeenCalledWith('');
    expect(component.showFullList()).toBe(false);
  });

  // ─── Expand/Collapse ──────────────────────────────────────────────────

  it('should expand list', () => {
    component.expandList();
    expect(component.showFullList()).toBe(true);
  });

  it('should collapse list', () => {
    component.showFullList.set(true);
    component.collapseList();
    expect(component.showFullList()).toBe(false);
  });

  // ─── Pagination ───────────────────────────────────────────────────────

  it('should update page index and reload on page change', () => {
    const pageEvent: PageEvent = { pageIndex: 2, pageSize: 20, length: 50 };
    component.onPageChange(pageEvent);
    expect(component.pageIndex()).toBe(2);
    expect(component.pageSize()).toBe(20);
    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ page: { page: 2, pageSize: 20 } }),
    );
  });

  // ─── Format Label ─────────────────────────────────────────────────────

  it('should format label with title, lesson count, and language pair', () => {
    const label = component.formatLabel(mockCourses[1]);
    expect(label).toBe('Course Two · 10 уроков · EN-RU');
  });
});
