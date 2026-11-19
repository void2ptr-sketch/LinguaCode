import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CardEditorDialogComponent } from './card-editor-dialog.component';
import { CardEditorDialogService } from './card-editor-dialog.service';

describe('CardEditorDialogService', () => {
  let service: CardEditorDialogService;
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn().mockReturnValue({
      afterClosed: () => of({ saved: true }),
    });

    TestBed.configureTestingModule({
      imports: [MatDialogModule],
      providers: [
        CardEditorDialogService,
        provideHttpClient(),
        { provide: MatDialog, useValue: { open: openSpy } },
      ],
    });

    service = TestBed.inject(CardEditorDialogService);
  });

  it('should open create dialog with adaptive size config', async () => {
    const result = await service.openCreate('select');

    expect(result).toEqual({ saved: true });
    expect(openSpy).toHaveBeenCalledWith(
      CardEditorDialogComponent,
      expect.objectContaining({
        panelClass: 'card-editor-dialog',
        width: 'min(1280px, 96vw)',
        maxWidth: '96vw',
        maxHeight: 'none',
        autoFocus: 'first-titled-element',
        data: { mode: 'create', kind: 'select' },
      }),
    );
  });

  it('should return undefined when dialog is already open', async () => {
    // Mock afterClosed to never resolve — keeps activeRef set
    openSpy.mockReturnValue({
      afterClosed: () => ({ then: () => ({ then: () => void 0 }) }),
    });

    // Start first call but don't await — this sets activeRef
    void service.openCreate('select');

    // Second call should return undefined because activeRef is set
    const secondResult = await service.openCreate('flip');
    expect(secondResult).toBeUndefined();
  });
});
