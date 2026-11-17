import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, beforeEach } from 'vitest';
import { LessonDeleteConfirmDialogComponent } from './lesson-delete-confirm-dialog.component';

describe('LessonDeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<LessonDeleteConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LessonDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { lessonTitle: 'Test Lesson' } },
      ],
    });
    fixture = TestBed.createComponent(LessonDeleteConfirmDialogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Удалить урок?');
  });

  it('should render lesson title in content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Test Lesson');
  });

  it('should render hint text', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('восстановить');
  });

  it('should render cancel button', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Отмена');
    });
    expect(cancelButton).toBeDefined();
  });

  it('should render delete button with warn color', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const deleteButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Удалить');
    }) as HTMLButtonElement | undefined;
    expect(deleteButton).toBeDefined();
    expect(deleteButton?.getAttribute('color')).toBe('warn');
  });
});

describe('LessonDeleteConfirmDialogComponent — empty title', () => {
  it('should handle empty lesson title', () => {
    TestBed.configureTestingModule({
      imports: [LessonDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { lessonTitle: '' } },
      ],
    });
    const emptyFixture = TestBed.createComponent(LessonDeleteConfirmDialogComponent);
    emptyFixture.detectChanges();
    const content = emptyFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('«»');
  });
});

describe('LessonDeleteConfirmDialogComponent — null title', () => {
  it('should handle null lesson title gracefully', () => {
    TestBed.configureTestingModule({
      imports: [LessonDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { lessonTitle: null as unknown as string } },
      ],
    });
    const nullFixture = TestBed.createComponent(LessonDeleteConfirmDialogComponent);
    nullFixture.detectChanges();
    const content = nullFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content).toBeTruthy();
  });
});
