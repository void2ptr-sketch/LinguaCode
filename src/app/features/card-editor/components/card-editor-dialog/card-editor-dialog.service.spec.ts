import { vi, type MockedObject } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CardEditorDialogComponent } from './card-editor-dialog.component';
import { CardEditorDialogService } from './card-editor-dialog.service';

describe('CardEditorDialogService', () => {
  let service: CardEditorDialogService;
  let dialog: Pick<MockedObject<MatDialog>, 'open'>;

  beforeEach(() => {
    dialog = {
      open: vi.fn().mockName('MatDialog.open'),
    };
    dialog.open.mockReturnValue({
      afterClosed: () => of({ saved: true }),
    } as ReturnType<MatDialog['open']>);

    TestBed.configureTestingModule({
      providers: [
        CardEditorDialogService,
        provideHttpClient(),
        { provide: MatDialog, useValue: dialog },
      ],
    });

    service = TestBed.inject(CardEditorDialogService);
  });

  it('should open create dialog with disableClose config', async () => {
    const result = await service.openCreate('select');

    expect(result).toEqual({ saved: true });
    expect(dialog.open).toHaveBeenCalledWith(
      CardEditorDialogComponent,
      expect.objectContaining({
        panelClass: 'card-editor-dialog',
        disableClose: true,
        data: { mode: 'create', kind: 'select' },
      }),
    );
  });
});
