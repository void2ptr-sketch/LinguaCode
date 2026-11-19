import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CourseImportDialogComponent } from './course-import-dialog.component';
import type { ImportPreview } from './course-import-dialog.types';

describe('CourseImportDialogComponent', () => {
  let component: CourseImportDialogComponent;
  let dialogRef: { close: ReturnType<typeof vi.fn> } | undefined;

  const mockData: ImportPreview = {
    courseTitle: 'Test Course',
    programCount: 1,
    lessonCount: 2,
    scenarioCount: 3,
    cardCount: 10,
    fileSize: 1024,
  };

  beforeEach(() => {
    dialogRef = {
      close: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [MatDialogModule, CourseImportDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    });
    component = TestBed.createComponent(CourseImportDialogComponent).componentRef.instance;
  });

  it('should expose dialog data', () => {
    expect(component.data).toBe(mockData);
  });

  it('should return null fileSizeWarning for small files', () => {
    expect(component.fileSizeWarning).toBeNull();
  });

  it('should return fileSizeWarning for large files (>3MB)', () => {
    TestBed.resetTestingModule();
    const largeData: ImportPreview = { ...mockData, fileSize: 3 * 1024 * 1024 + 1 };
    const largeDialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MatDialogModule, CourseImportDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: largeDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: largeData },
      ],
    });
    const largeComponent = TestBed.createComponent(CourseImportDialogComponent).componentRef
      .instance;

    expect(largeComponent.fileSizeWarning).toBeTruthy();
    expect(largeComponent.fileSizeWarning).toContain('МБ');
    expect(largeComponent.fileSizeWarning).toContain('localStorage');
  });

  it('should not show warning at exactly 3MB', () => {
    TestBed.resetTestingModule();
    const exactData: ImportPreview = { ...mockData, fileSize: 3 * 1024 * 1024 };
    const exactDialogRef = { close: vi.fn() };

    TestBed.configureTestingModule({
      imports: [MatDialogModule, CourseImportDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: exactDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: exactData },
      ],
    });
    const exactComponent = TestBed.createComponent(CourseImportDialogComponent).componentRef
      .instance;

    expect(exactComponent.fileSizeWarning).toBeNull();
  });

  it('should close with confirmed result on onConfirm', () => {
    component.onConfirm();
    expect(dialogRef!.close).toHaveBeenCalledWith({
      confirmed: true,
      bundleJson: '',
    });
  });

  it('should close without result on onCancel', () => {
    component.onCancel();
    expect(dialogRef?.close).toHaveBeenCalledWith();
  });
});
