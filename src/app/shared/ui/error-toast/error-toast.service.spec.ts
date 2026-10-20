import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorToastService } from './error-toast.service';

describe('ErrorToastService', () => {
  let service: ErrorToastService;
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarSpy = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [ErrorToastService, { provide: MatSnackBar, useValue: snackBarSpy }],
    });

    service = TestBed.inject(ErrorToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show error message via snackBar', () => {
    service.show(new Error('Something went wrong'));

    expect(snackBarSpy.open).toHaveBeenCalledWith('Something went wrong', 'Закрыть', {
      duration: 4000,
      panelClass: ['error-toast'],
    });
  });

  it('should use fallback when error is unrecognizable', () => {
    service.show(null as never, 'Custom fallback');

    expect(snackBarSpy.open).toHaveBeenCalledWith('Custom fallback', 'Закрыть', {
      duration: 4000,
      panelClass: ['error-toast'],
    });
  });

  it('should use default fallback message', () => {
    service.show('');

    expect(snackBarSpy.open).toHaveBeenCalledWith('Произошла ошибка', 'Закрыть', {
      duration: 4000,
      panelClass: ['error-toast'],
    });
  });
});
