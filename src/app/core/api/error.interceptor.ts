import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { isApiRequest } from './api-url';
import { toHttpApiError } from './api-error.utils';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!isApiRequest(req.url)) {
        return throwError(() => error);
      }

      return throwError(() => toHttpApiError(error));
    }),
  );
};
