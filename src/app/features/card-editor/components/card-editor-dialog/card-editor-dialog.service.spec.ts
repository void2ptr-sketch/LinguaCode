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

  it('should open create dialog with disableClose config', async () => {
    const result = await service.openCreate('select');

    expect(result).toEqual({ saved: true });
    expect(openSpy).toHaveBeenCalledWith(
      CardEditorDialogComponent,
      expect.objectContaining({
        panelClass: 'card-editor-dialog',
        disableClose: true,
        data: { mode: 'create', kind: 'select' },
      }),
    );
  });
});
