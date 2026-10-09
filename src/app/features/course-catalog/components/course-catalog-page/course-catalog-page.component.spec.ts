import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import type { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { CourseSearchService } from '../../../../core/data';
import type {
  ContentLanguage,
  CourseIndexEntry,
  CourseSearchPage,
  CourseWithLessons,
  UserLanguagePairEntry,
} from '../../../../core/models';
import type { ToneColorSchemeId } from '../../../../core/models/tone-color.types';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { UiPaginationComponent } from '../../../../shared/ui/pagination';
import {
  CourseDisplaySettingsMatrixComponent,
} from '../../../../shared/ui/course-display-settings-matrix';
import { CourseCatalogStore } from '../../services/course-catalog.store';
import { CourseCatalogPageComponent } from './course-catalog-page.component';

function makePair(id: string, known: ContentLanguage, learning: ContentLanguage): UserLanguagePairEntry {
  return {
    id,
    pair: { known, learning },
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

function makeCourse(id: string, title: string, lessonCount: number): CourseIndexEntry {
  return {
    id,
    title,
    authorId: 'author-1',
    lessonCount,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
  };
}

describe('CourseCatalogPageComponent', () => {
  let mockCourseSearchService: Partial<CourseSearchService>;
  let mockUserStore: Partial<UserStore>;
  let mockResultsStore: Partial<LearningResultsStore>;
  let mockRouter: Partial<Router>;
  let mockCatalogStore: Partial<CourseCatalogStore>;

  const mockPairs: UserLanguagePairEntry[] = [makePair('pair-1', 'ru', 'en')];

  const mockPage: CourseSearchPage = {
    items: [makeCourse('c-1', 'Course 1', 10)],
    page: 0,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  };

  const mockCourse: CourseWithLessons = {
    id: 'c-1',
    title: 'Course 1',
    description: 'Test course',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'en' },
    lessonIds: ['l-1', 'l-2'],
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons: [
      {
        id: 'l-1',
        courseId: 'c-1',
        title: 'Lesson 1',
        description: '',
        scenarioIds: ['s-1'],
        prerequisiteLessonIds: [],
        order: 0,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'l-2',
        courseId: 'c-1',
        title: 'Lesson 2',
        description: '',
        scenarioIds: ['s-2'],
        prerequisiteLessonIds: [],
        order: 1,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  beforeEach(async () => {
    mockCourseSearchService = {
      search: vi.fn().mockResolvedValue(mockPage),
      getById: vi.fn().mockResolvedValue(mockCourse),
    };

    mockUserStore = {
      displayName: signal('Ученик'),
      preferences: signal({
        theme: 'azure-blue',
        fontSize: 'md',
        colorScheme: 'light',
        cardFocusFullscreen: false,
        learningProficiencyLevel: 'beginner',
        languagePairs: mockPairs,
        activeLanguagePairId: 'pair-1',
      }),
      languagePairs: signal(mockPairs),
      activeLanguagePairId: signal('pair-1'),
      languagePair: signal({ known: 'ru', learning: 'en' }),
      formatEntryLabel: vi.fn((entry: UserLanguagePairEntry) => `${entry.pair.known} → ${entry.pair.learning}`),
      isActiveEntry: vi.fn((entry: UserLanguagePairEntry) => entry.id === 'pair-1'),
      setActiveLanguagePair: vi.fn(),
      removeLanguagePair: vi.fn(),
      addLanguagePair: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePreferences: vi.fn(),
      updateLanguagePairSettings: vi.fn(),
    };

    mockResultsStore = {
      courseProgress: vi.fn(() => ({ completed: 5, total: 10, percent: 50, courseId: 'c-1' })),
      isCourseCompleted: vi.fn(() => false),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    // Mock for CourseCatalogStore with proper Signal types
    const mockItemsSignal = signal([] as readonly CourseIndexEntry[]);
    const mockTotalItemsSignal = signal(0);
    const mockPageIndexSignal = signal(0);
    const mockPageSizeSignal = signal(10);
    const mockLoadingSignal = signal(false);
    const mockErrorSignal = signal(null as unknown as string | null);
    const mockProgressByCourseIdSignal = signal({} as Readonly<Record<string, number>>);
    const mockCompletedCourseIdsSignal = signal(new Set() as ReadonlySet<string>);
    const mockNameDraftSignal = signal('Ученик');
    const mockLearningProficiencyDraftSignal = signal('beginner' as import('../../../../core/models').LearningProficiencyLevel);
    const mockThemeDraftSignal = signal('light' as import('../../../../core/models').AppColorScheme);
    const mockFontSizeDraftSignal = signal('md' as import('../../../../core/models').UserPreferences['fontSize']);
    const mockColorSchemeDraftSignal = signal('light' as import('../../../../core/models').AppColorScheme);
    const mockCardFocusFullscreenDraftSignal = signal(false);
    const mockKnownLanguageDraftSignal = signal('ru' as ContentLanguage);
    const mockLearningLanguageDraftSignal = signal('en' as ContentLanguage);
    const mockSettingsPairIdDraftSignal = signal('pair-1');
    const mockDisplayRomanizationsDraftSignal = signal([] as readonly import('../../../../core/models').RomanizationSystem[]);
    const mockAnswerRomanizationsDraftSignal = signal([] as readonly import('../../../../core/models').RomanizationSystem[]);
    const mockShowIpaDraftSignal = signal(false);
    const mockIpaVariantLabelDraftSignal = signal('');
    const mockAnswerModesDraftSignal = signal([] as readonly import('../../../../shared/ui/course-display-settings-matrix/course-display-settings-matrix.util').AnswerDisplayMode[]);
    const mockToneColorEnabledDraftSignal = signal(false);
    const mockToneColorSchemeDraftSignal = signal('default' as ToneColorSchemeId);
    const mockTracingStrokeDurationDraftSignal = signal(0.5);
    const mockSelectedTabIndexSignal = signal(0);

    mockCatalogStore = {
      items: mockItemsSignal,
      totalItems: mockTotalItemsSignal,
      pageIndex: mockPageIndexSignal,
      pageSize: mockPageSizeSignal,
      loading: mockLoadingSignal,
      error: mockErrorSignal,
      progressByCourseId: mockProgressByCourseIdSignal,
      completedCourseIds: mockCompletedCourseIdsSignal,
      nameDraft: mockNameDraftSignal,
      learningProficiencyDraft: mockLearningProficiencyDraftSignal,
      themeDraft: mockThemeDraftSignal,
      fontSizeDraft: mockFontSizeDraftSignal,
      colorSchemeDraft: mockColorSchemeDraftSignal,
      cardFocusFullscreenDraft: mockCardFocusFullscreenDraftSignal,
      knownLanguageDraft: mockKnownLanguageDraftSignal,
      learningLanguageDraft: mockLearningLanguageDraftSignal,
      settingsPairIdDraft: mockSettingsPairIdDraftSignal,
      displayRomanizationsDraft: mockDisplayRomanizationsDraftSignal,
      answerRomanizationsDraft: mockAnswerRomanizationsDraftSignal,
      showIpaDraft: mockShowIpaDraftSignal,
      ipaVariantLabelDraft: mockIpaVariantLabelDraftSignal,
      answerModesDraft: mockAnswerModesDraftSignal,
      toneColorEnabledDraft: mockToneColorEnabledDraftSignal,
      toneColorSchemeDraft: mockToneColorSchemeDraftSignal,
      tracingStrokeDurationDraft: mockTracingStrokeDurationDraftSignal,
      selectedTabIndex: mockSelectedTabIndexSignal,
      languagePairInvalid: computed(
        () => mockKnownLanguageDraftSignal() === mockLearningLanguageDraftSignal(),
      ),
      setItems: (items: readonly CourseIndexEntry[]) => mockItemsSignal.set(items),
      setTotalItems: (total: number) => mockTotalItemsSignal.set(total),
      setPageIndex: (page: number) => mockPageIndexSignal.set(page),
      setPageSize: (size: number) => mockPageSizeSignal.set(size),
      setLoading: (loading: boolean) => mockLoadingSignal.set(loading),
      setError: (error: string | null) => mockErrorSignal.set(error),
      setProgressByCourseId: (progress: Record<string, number>) => mockProgressByCourseIdSignal.set(progress as Readonly<Record<string, number>>),
      setCompletedCourseIds: (completed: Set<string>) => mockCompletedCourseIdsSignal.set(completed as ReadonlySet<string>),
      setNameDraft: (name: string) => mockNameDraftSignal.set(name),
      setLearningProficiencyDraft: (level: import('../../../../core/models').LearningProficiencyLevel) => mockLearningProficiencyDraftSignal.set(level),
      setThemeDraft: (theme: import('../../../../core/models').AppColorScheme) => mockThemeDraftSignal.set(theme),
      setFontSizeDraft: (size: import('../../../../core/models').UserPreferences['fontSize']) => mockFontSizeDraftSignal.set(size),
      setColorSchemeDraft: (scheme: import('../../../../core/models').AppColorScheme) => mockColorSchemeDraftSignal.set(scheme),
      setCardFocusFullscreenDraft: (enabled: boolean) => mockCardFocusFullscreenDraftSignal.set(enabled),
      setKnownLanguageDraft: (lang: ContentLanguage) => mockKnownLanguageDraftSignal.set(lang),
      setLearningLanguageDraft: (lang: ContentLanguage) => mockLearningLanguageDraftSignal.set(lang),
      setSettingsPairIdDraft: (id: string) => mockSettingsPairIdDraftSignal.set(id),
      setDisplayRomanizationsDraft: (romanizations: readonly import('../../../../core/models').RomanizationSystem[]) => mockDisplayRomanizationsDraftSignal.set(romanizations),
      setAnswerRomanizationsDraft: (romanizations: readonly import('../../../../core/models').RomanizationSystem[]) => mockAnswerRomanizationsDraftSignal.set(romanizations),
      setShowIpaDraft: (show: boolean) => mockShowIpaDraftSignal.set(show),
      setIpaVariantLabelDraft: (label: string) => mockIpaVariantLabelDraftSignal.set(label),
      setAnswerModesDraft: (modes: readonly import('../../../../shared/ui/course-display-settings-matrix/course-display-settings-matrix.util').AnswerDisplayMode[]) => mockAnswerModesDraftSignal.set(modes),
      setToneColorEnabledDraft: (enabled: boolean) => mockToneColorEnabledDraftSignal.set(enabled),
      setToneColorSchemeDraft: (scheme: ToneColorSchemeId) => mockToneColorSchemeDraftSignal.set(scheme),
      setTracingStrokeDurationDraft: (duration: number) => mockTracingStrokeDurationDraftSignal.set(duration),
      setSelectedTabIndex: (index: number) => mockSelectedTabIndexSignal.set(index),
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSlideToggleModule,
        MatSliderModule,
        MatTabsModule,
        UiPaginationComponent,
        CourseDisplaySettingsMatrixComponent,
        CourseCatalogPageComponent,
      ],
      providers: [
        { provide: CourseSearchService, useValue: mockCourseSearchService },
        { provide: UserStore, useValue: mockUserStore },
        { provide: LearningResultsStore, useValue: mockResultsStore },
        { provide: CourseCatalogStore, useValue: mockCatalogStore },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with default signals', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.pageIndex()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.selectedTabIndex()).toBe(0);
  });

  it('should load courses on init', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockCourseSearchService.search).toHaveBeenCalled();
  });

  it('should set loading during load', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    await fixture.whenStable();
  });

  it('should set items after load completes', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.items().length).toBe(1);
    expect(component.items()[0].id).toBe('c-1');
  });

  it('should set totalItems after load', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.totalItems()).toBe(1);
  });

  it('should set error on load failure', async () => {
    (mockCourseSearchService.search as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe('Не удалось загрузить каталог курсов');
  });

  it('should always set loading to false after load', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
  });

  it('should navigate to cards/select on startCourse', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    void component.startCourse('c-1');
    await fixture.whenStable();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/cards/select'], {
      queryParams: { courseId: 'c-1' },
    });
  });

  it('should compute languagePairInvalid correctly', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.languagePairInvalid()).toBe(false);

    (mockCatalogStore.knownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');
    (mockCatalogStore.learningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');
    fixture.detectChanges();

    expect(component.languagePairInvalid()).toBe(true);
  });

  it('should compute canRemovePair based on language pairs count', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.canRemovePair()).toBe(false);

    (mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>).set([
      makePair('pair-1', 'ru', 'en'),
      makePair('pair-2', 'en', 'zh'),
    ]);
    fixture.detectChanges();

    expect(component.canRemovePair()).toBe(true);
  });

  it('should call user store setActive when setActive called', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.setActive('pair-1');
    await fixture.whenStable();

    expect(mockUserStore.setActiveLanguagePair).toHaveBeenCalledWith('pair-1');
  });

  it('should call user store removeLanguagePair when removePair called', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.removePair('pair-1');
    await fixture.whenStable();

    expect(mockUserStore.removeLanguagePair).toHaveBeenCalledWith('pair-1');
  });

  it('should not add language pair when languages are the same', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    (mockCatalogStore.knownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');
    (mockCatalogStore.learningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');
    component.addPair();
    await fixture.whenStable();

    expect(mockUserStore.addLanguagePair).not.toHaveBeenCalled();
  });

  it('should save profile settings', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    (mockCatalogStore.nameDraft as import('@angular/core').WritableSignal<string>).set('Новое имя');
    component.saveProfile();
    await fixture.whenStable();

    expect(mockUserStore.updateDisplayName).toHaveBeenCalledWith('Новое имя');
    expect(mockUserStore.updatePreferences).toHaveBeenCalled();
  });

  it('should change tab index when selected', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedTabIndex()).toBe(0);
    (mockCatalogStore.selectedTabIndex as import('@angular/core').WritableSignal<number>).set(1);
    expect(component.selectedTabIndex()).toBe(1);
  });

  it('should call onPageChange and update signals', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pageEvent: PageEvent = {
      pageIndex: 1,
      pageSize: 20,
      length: 100,
    } as PageEvent;
    void component.onPageChange(pageEvent);
    await fixture.whenStable();

    expect(component.pageIndex()).toBe(1);
    expect(component.pageSize()).toBe(20);
  });

  it('should compute progress percent correctly', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    (mockCatalogStore.progressByCourseId as import('@angular/core').WritableSignal<Readonly<Record<string, number>>>).set({ 'c-1': 75 } as Readonly<Record<string, number>>);
    expect(component.progressPercent('c-1')).toBe(75);
    expect(component.progressPercent('unknown')).toBe(0);
  });

  it('should compute isCourseCompleted correctly', async () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    (mockCatalogStore.completedCourseIds as import('@angular/core').WritableSignal<ReadonlySet<string>>).set(new Set(['c-1']) as ReadonlySet<string>);
    expect(component.isCourseCompleted('c-1')).toBe(true);
    expect(component.isCourseCompleted('c-2')).toBe(false);
  });

  it('should format tracing duration with one decimal', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.formatTracingDurationSec(0.5)).toBe('0.5 с');
    expect(component.formatTracingDurationSec(1.25)).toBe('1.3 с');
  });

  it('should render header with title', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('mat-card-title');
    expect(title?.textContent?.trim()).toBe('Каталог курсов');
  });

  it('should render tab group', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    fixture.detectChanges();

    const tabGroup = fixture.nativeElement.querySelector('mat-tab-group');
    expect(tabGroup).toBeTruthy();
  });

  it('should render save button', () => {
    const fixture = TestBed.createComponent(CourseCatalogPageComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    let saveBtn: HTMLButtonElement | undefined;
    buttons.forEach((btn: HTMLButtonElement) => {
      if (btn.textContent?.trim() === 'Сохранить') {
        saveBtn = btn;
      }
    });
    expect(saveBtn).toBeTruthy();
  });
});
