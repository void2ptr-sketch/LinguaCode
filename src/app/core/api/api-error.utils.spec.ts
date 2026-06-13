import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage, isHttpApiError, toHttpApiError } from './api-error.utils';

describe('api-error.utils', () => {
  it('should map HttpErrorResponse to HttpApiError', () => {
    const httpError = new HttpErrorResponse({
      status: 404,
      statusText: 'Not Found',
      error: { message: 'Сценарий не найден' },
    });

    const apiError = toHttpApiError(httpError);

    expect(isHttpApiError(apiError)).toBeTrue();
    expect(apiError.status).toBe(404);
    expect(apiError.message).toBe('Сценарий не найден');
    expect(apiError.body?.message).toBe('Сценарий не найден');
  });

  it('should use fallback message for unknown errors', () => {
    expect(getApiErrorMessage('unexpected', 'Ошибка загрузки')).toBe('Ошибка загрузки');
  });
});
