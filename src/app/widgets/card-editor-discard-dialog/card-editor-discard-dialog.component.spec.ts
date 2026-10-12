import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';

import { CardEditorDiscardDialogComponent } from './card-editor-discard-dialog.component';

describe('CardEditorDiscardDialogComponent', () => {
  let fixture: ComponentFixture<CardEditorDiscardDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardEditorDiscardDialogComponent, MatButtonModule, MatDialogModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: { close: () => void 0 } },
      ],
    });
    fixture = TestBed.createComponent(CardEditorDiscardDialogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Закрыть без сохранения?');
  });

  it('should render dialog content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Несохранённые изменения будут потеряны');
  });

  it('should render cancel button', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Остаться');
    });
    expect(cancelButton).toBeDefined();
  });

  it('should render confirm button with warn color', () => {
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Закрыть');
    });
    expect(confirmButton).toBeDefined();
    expect((confirmButton as HTMLButtonElement)?.getAttribute('color')).toBe('warn');
  });

  it('should close with false on cancel button click', () => {
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentRef.injector.get(MatDialogRef).close = closeSpy;

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Остаться');
    }) as HTMLButtonElement | undefined;
    cancelButton?.dispatchEvent(new Event('click'));

    expect(closeSpy).toHaveBeenCalledWith(false);
  });

  it('should close with true on confirm button click', () => {
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentRef.injector.get(MatDialogRef).close = closeSpy;

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const confirmButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Закрыть');
    }) as HTMLButtonElement | undefined;
    confirmButton?.dispatchEvent(new Event('click'));

    expect(closeSpy).toHaveBeenCalledWith(true);
  });
});
