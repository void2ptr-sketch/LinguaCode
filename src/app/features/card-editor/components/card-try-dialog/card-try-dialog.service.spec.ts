import { vi, type MockedObject } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CardTryDialogComponent } from './card-try-dialog.component';
import { CardTryDialogService } from './card-try-dialog.service';

describe('CardTryDialogService', () => {
  let service: CardTryDialogService;
  let dialog: Pick<MockedObject<MatDialog>, 'open'>;

  beforeEach(() => {
    dialog = {
      open: vi.fn().mockName('MatDialog.open'),
    };
    dialog.open.mockReturnValue({
      afterClosed: () => of(undefined),
    } as ReturnType<MatDialog['open']>);

    TestBed.configureTestingModule({
      providers: [
        CardTryDialogService,
        provideHttpClient(),
        { provide: MatDialog, useValue: dialog },
      ],
    });

    service = TestBed.inject(CardTryDialogService);
  });

  it('should open try dialog for card id', async () => {
    await service.open('card-1');

    expect(dialog.open).toHaveBeenCalledWith(
      CardTryDialogComponent,
      expect.objectContaining({
        panelClass: 'card-try-dialog',
        data: { cardId: 'card-1' },
      }),
    );
  });
});
