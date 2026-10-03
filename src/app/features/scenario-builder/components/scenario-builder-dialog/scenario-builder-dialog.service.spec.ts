import { vi, type MockedObject } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import { ScenarioBuilderDialogService } from './scenario-builder-dialog.service';

describe('ScenarioBuilderDialogService', () => {
  let service: ScenarioBuilderDialogService;
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
        ScenarioBuilderDialogService,
        provideHttpClient(),
        { provide: MatDialog, useValue: dialog },
      ],
    });

    service = TestBed.inject(ScenarioBuilderDialogService);
  });

  it('should open create dialog with disableClose config', async () => {
    const result = await service.openCreate();

    expect(result).toEqual({ saved: true });
    expect(dialog.open).toHaveBeenCalledWith(
      ScenarioBuilderDialogComponent,
      expect.objectContaining({
        panelClass: 'scenario-builder-dialog',
        disableClose: true,
        data: { mode: 'create' },
      }),
    );
  });
});
