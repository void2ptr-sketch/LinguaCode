import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { describe, expect, it, beforeEach } from 'vitest';
import { ScenarioDeleteConfirmDialogComponent } from './scenario-delete-confirm-dialog.component';

describe('ScenarioDeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ScenarioDeleteConfirmDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScenarioDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { scenarioTitle: 'Test Scenario' } },
      ],
    });
    fixture = TestBed.createComponent(ScenarioDeleteConfirmDialogComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Удалить сценарий?');
  });

  it('should render scenario title in content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Test Scenario');
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

describe('ScenarioDeleteConfirmDialogComponent — empty title', () => {
  it('should handle empty scenario title', () => {
    TestBed.configureTestingModule({
      imports: [ScenarioDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { scenarioTitle: '' } },
      ],
    });
    const emptyFixture = TestBed.createComponent(ScenarioDeleteConfirmDialogComponent);
    emptyFixture.detectChanges();
    const content = emptyFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('«»');
  });
});

describe('ScenarioDeleteConfirmDialogComponent — null title', () => {
  it('should handle null scenario title gracefully', () => {
    TestBed.configureTestingModule({
      imports: [ScenarioDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { scenarioTitle: null as unknown as string } },
      ],
    });
    const nullFixture = TestBed.createComponent(ScenarioDeleteConfirmDialogComponent);
    nullFixture.detectChanges();
    const content = nullFixture.nativeElement.querySelector('mat-dialog-content');
    expect(content).toBeTruthy();
  });
});
