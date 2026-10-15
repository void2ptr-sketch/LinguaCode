import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getApiErrorMessage } from '../../api/api-error.utils';

const DEFAULT_ERROR_MESSAGE = 'Произошла ошибка';

/**
 * Shows user-facing error notifications via Angular Material SnackBar.
 *
 * @remarks
 * Extracts a human-readable message from any error value using
 * `getApiErrorMessage` and displays it with a dismiss action. Used by the
 * global error handler and by feature stores for unexpected failures.
 */
@Injectable({ providedIn: 'root' })
export class ErrorToastService {
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Displays an error toast.
   *
   * @param error - The error value to describe.
   * @param fallback - Message used when the error cannot be read.
   */
  show(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): void {
    const message = getApiErrorMessage(error, fallback);
    this.snackBar.open(message, 'Закрыть', {
      duration: 4000,
      panelClass: ['error-toast'],
    });
  }
}
