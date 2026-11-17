import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, beforeEach } from 'vitest';
import { CourseDeleteConfirmDialogComponent } from './course-delete-confirm-dialog.component';

describe('CourseDeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<CourseDeleteConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourseDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { courseTitle: 'Test Course' } },
      ],
    });
    fixture = TestBed.createComponent(CourseDeleteConfirmDialogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Удалить курс?');
  });

  it('should render course title in content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Test Course');
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

describe('CourseDeleteConfirmDialogComponent — empty title', () => {
  it('should handle empty course title', () => {
    TestBed.configureTestingModule({
      imports: [CourseDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { courseTitle: '' } },
      ],
    });
    const emptyFixture = TestBed.createComponent(CourseDeleteConfirmDialogComponent);
    emptyFixture.detectChanges();
    const content = emptyFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('«»');
  });
});

describe('CourseDeleteConfirmDialogComponent — null title', () => {
  it('should handle null course title gracefully', () => {
    TestBed.configureTestingModule({
      imports: [CourseDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { courseTitle: null as unknown as string } },
      ],
    });
    const nullFixture = TestBed.createComponent(CourseDeleteConfirmDialogComponent);
    nullFixture.detectChanges();
    const content = nullFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content).toBeTruthy();
  });
});
