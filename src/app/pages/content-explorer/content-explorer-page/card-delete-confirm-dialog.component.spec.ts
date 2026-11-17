import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, beforeEach } from 'vitest';
import { CardDeleteConfirmDialogComponent } from './card-delete-confirm-dialog.component';

describe('CardDeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<CardDeleteConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { cardTitle: 'Test Card' } }],
    });
    fixture = TestBed.createComponent(CardDeleteConfirmDialogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Удалить карточку?');
  });

  it('should render card title in content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Test Card');
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

describe('CardDeleteConfirmDialogComponent — empty title', () => {
  it('should handle empty card title', () => {
    TestBed.configureTestingModule({
      imports: [CardDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { cardTitle: '' } }],
    });
    const emptyFixture = TestBed.createComponent(CardDeleteConfirmDialogComponent);
    emptyFixture.detectChanges();
    const content = emptyFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('«»');
  });
});

describe('CardDeleteConfirmDialogComponent — null title', () => {
  it('should handle null card title gracefully', () => {
    TestBed.configureTestingModule({
      imports: [CardDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { cardTitle: null as unknown as string } }],
    });
    const nullFixture = TestBed.createComponent(CardDeleteConfirmDialogComponent);
    nullFixture.detectChanges();
    const content = nullFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content).toBeTruthy();
  });
});
