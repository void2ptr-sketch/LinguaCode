import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { vi, describe, expect, it, beforeEach } from 'vitest';

import { CourseBuilderPageComponent } from './course-builder-page.component';
import { CourseBuilderStore } from '../../../features/course-builder/services/course-builder.store';
import { CourseBuilderDialogService } from '../../../features/course-builder/components/course-builder-dialog/course-builder-dialog.service';
import { UserStore } from '../../../entities/user/model/user.store';

describe('CourseBuilderPageComponent', () => {
  let fixture: ComponentFixture<CourseBuilderPageComponent>;
  let component: CourseBuilderPageComponent;
  let snackBarOpen: ReturnType<typeof vi.fn>;
  let storeExportBundleSpy: ReturnType<typeof vi.fn>;
  let storeExportPdfSpy: ReturnType<typeof vi.fn>;
  let storeExportErrorSpy: ReturnType<typeof vi.fn>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  const TEST_USER_ID = 'user-1';
  const TEST_COURSE_ID = 'course-1';

  beforeEach(() => {
    snackBarOpen = vi.fn();
    storeExportBundleSpy = vi.fn().mockResolvedValue(null);
    storeExportPdfSpy = vi.fn().mockResolvedValue(false);
    storeExportErrorSpy = vi.fn().mockReturnValue(null);
    dialogOpenSpy = vi.fn().mockReturnValue(Promise.resolve(undefined));

    TestBed.configureTestingModule({
      imports: [
        CourseBuilderPageComponent,
        FormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        CourseBuilderStore,
        CourseBuilderDialogService,
        {
          provide: UserStore,
          useValue: {
            user: () => ({ id: TEST_USER_ID }),
            activeLanguagePairId: () => 'pair-1',
            languagePairs: () => [],
            setActiveLanguagePair: vi.fn(),
            formatEntryLabel: () => '',
          },
        },
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
      ],
    });

    // Override store methods
    const store = TestBed.inject(CourseBuilderStore);
    vi.spyOn(store, 'exportCourseBundle')
      .mockImplementation(storeExportBundleSpy as unknown as () => Promise<string | null>);
    vi.spyOn(store, 'exportPdf')
      .mockImplementation(storeExportPdfSpy as unknown as (id: string, hints: boolean) => Promise<boolean>);
    vi.spyOn(store, 'exportError')
      .mockImplementation(storeExportErrorSpy as unknown as () => string | null);

    fixture = TestBed.createComponent(CourseBuilderPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have CourseBuilderStore injected', () => {
    expect(component.store).toBeDefined();
  });

  it('should have list management methods', () => {
    expect(component.onListScopeChange).toBeDefined();
    expect(component.onListPageChange).toBeDefined();
  });

  it('should have export methods', () => {
    expect(component.exportPdf).toBeDefined();
    expect(typeof component.exportPdf).toBe('function');
  });

  it('should be instantiated', () => {
    expect(component).toBeTruthy();
  });

  describe('isOwnCourse', () => {
    it('should return true when authorId matches user id', () => {
      expect(component.isOwnCourse(TEST_USER_ID)).toBe(true);
    });

    it('should return false when authorId differs', () => {
      expect(component.isOwnCourse('other-user')).toBe(false);
    });
  });

  describe('exportCourse', () => {
    it('should show snackbar error when export returns null', async () => {
      storeExportBundleSpy.mockResolvedValueOnce(null);
      storeExportErrorSpy.mockReturnValueOnce('Export failed');

      await component.exportCourse(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith('Export failed', 'Закрыть', { duration: 8000 });
    });

    it('should show success snackbar when export returns JSON', async () => {
      const json = JSON.stringify({ id: TEST_COURSE_ID });
      storeExportBundleSpy.mockResolvedValueOnce(json);

      await component.exportCourse(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith(
        "Файл экспортирован. Передайте его maintainer'у для добавления в общий каталог.",
        'Закрыть',
        { duration: 10000 },
      );
    });
  });

  describe('exportPdf', () => {
    it('should show snackbar error when export fails', async () => {
      storeExportPdfSpy.mockResolvedValueOnce(false);
      storeExportErrorSpy.mockReturnValueOnce('PDF error');

      await component.exportPdf(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith('PDF error', 'Закрыть', { duration: 8000 });
    });

    it('should show success message when export succeeds', async () => {
      storeExportPdfSpy.mockResolvedValueOnce(true);

      await component.exportPdf(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith('PDF с оглавлением экспортирован', 'Закрыть', {
        duration: 4000,
      });
    });
  });

  describe('exportPdfWithHints', () => {
    it('should show snackbar error when export fails', async () => {
      storeExportPdfSpy.mockResolvedValueOnce(false);
      storeExportErrorSpy.mockReturnValueOnce('PDF error');

      await component.exportPdfWithHints(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith('PDF error', 'Закрыть', { duration: 8000 });
    });

    it('should show success message when export succeeds', async () => {
      storeExportPdfSpy.mockResolvedValueOnce(true);

      await component.exportPdfWithHints(TEST_COURSE_ID);

      expect(snackBarOpen).toHaveBeenCalledWith(
        'PDF с оглавлением и подсказками экспортирован',
        'Закрыть',
        { duration: 4000 },
      );
    });
  });
});
