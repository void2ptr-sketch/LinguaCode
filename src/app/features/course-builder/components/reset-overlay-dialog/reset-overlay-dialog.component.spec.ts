import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { describe, expect, it, vi } from 'vitest';

import { ResetOverlayDialogComponent } from './reset-overlay-dialog.component';

describe('ResetOverlayDialogComponent', () => {
  let fixture: ComponentFixture<ResetOverlayDialogComponent>;
  let component: ResetOverlayDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ResetOverlayDialogComponent, MatButtonModule, MatDialogModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });

    fixture = TestBed.createComponent(ResetOverlayDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should have dialogRef injected', () => {
    expect(component.dialogRef).toBeDefined();
  });

  it('should render dialog title', () => {
    const root = fixture.nativeElement;
    const title = root.querySelector('h2[mat-dialog-title]');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Сбросить пользовательские данные');
  });

  it('should render dialog content', () => {
    const root = fixture.nativeElement;
    const content = root.querySelector('mat-dialog-content');
    expect(content).toBeTruthy();
  });

  it('should render warning message', () => {
    const root = fixture.nativeElement;
    const paragraphs = root.querySelectorAll('p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  it('should render cancel button', () => {
    const root = fixture.nativeElement;
    const buttons = root.querySelectorAll('button');
    const cancelButton = Array.from(buttons).find(
      (btn: unknown) => (btn as HTMLElement).textContent?.includes('Отмена'),
    );
    expect(cancelButton).toBeTruthy();
  });

  it('should render reset button', () => {
    const root = fixture.nativeElement;
    const buttons = root.querySelectorAll('button');
    const resetButton = Array.from(buttons).find(
      (btn: unknown) => (btn as HTMLElement).textContent?.includes('Сбросить'),
    );
    expect(resetButton).toBeTruthy();
  });

  it('should close dialog with true when reset button is clicked', () => {
    const closeSpy = vi.spyOn(component.dialogRef, 'close');
    component.dialogRef.close(true);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('should have standalone component', () => {
    expect(component).toBeTruthy();
  });
});
