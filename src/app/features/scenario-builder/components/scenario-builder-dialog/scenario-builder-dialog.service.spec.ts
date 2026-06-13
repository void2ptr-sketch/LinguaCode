import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ScenarioBuilderDialogComponent } from './scenario-builder-dialog.component';
import { ScenarioBuilderDialogService } from './scenario-builder-dialog.service';

describe('ScenarioBuilderDialogService', () => {
  let service: ScenarioBuilderDialogService;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue({
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
      jasmine.objectContaining({
        panelClass: 'scenario-builder-dialog',
        disableClose: true,
        data: { mode: 'create' },
      }),
    );
  });
});
