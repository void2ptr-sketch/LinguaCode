import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CardTryDialogComponent } from './card-try-dialog.component';
import { CardTryDialogService } from './card-try-dialog.service';

describe('CardTryDialogService', () => {
  let service: CardTryDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue({
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
      jasmine.objectContaining({
        panelClass: 'card-try-dialog',
        data: { cardId: 'card-1' },
      }),
    );
  });
});
