import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProgramDeleteConfirmDialogComponent } from './program-delete-confirm-dialog.component';

describe('ProgramDeleteConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ProgramDeleteConfirmDialogComponent>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    TestBed.configureTestingModule({
      imports: [ProgramDeleteConfirmDialogComponent, MatDialogModule, MatButtonModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { programTitle: 'Test Program' } },
        { provide: MatDialogRef, useValue: { close: () => void 0 } },
      ],
    });
    fixture = TestBed.createComponent(ProgramDeleteConfirmDialogComponent);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeDefined();
  });

  it('should render dialog title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('h2');
    expect(title?.textContent).toBe('Удалить программу?');
  });

  it('should render program title in content', () => {
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector('mat-dialog-content');
    expect(content?.textContent).toContain('Test Program');
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

  it('should close with false on cancel button click', () => {
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentRef.injector.get(MatDialogRef).close = closeSpy;

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Отмена');
    }) as HTMLButtonElement | undefined;
    cancelButton?.dispatchEvent(new Event('click'));

    expect(closeSpy).toHaveBeenCalledWith(false);
  });

  it('should close with true on delete button click', () => {
    fixture.detectChanges();
    const closeSpy = vi.fn();
    fixture.componentRef.injector.get(MatDialogRef).close = closeSpy;

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const deleteButton = [...buttons].find((b: unknown) => {
      const btn = b as HTMLButtonElement;
      return btn.textContent?.includes('Удалить');
    }) as HTMLButtonElement | undefined;
    deleteButton?.dispatchEvent(new Event('click'));

    expect(closeSpy).toHaveBeenCalledWith(true);
  });
});
