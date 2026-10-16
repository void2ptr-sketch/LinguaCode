import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { isApiRequest } from '../../../shared/api/api-url';
import { NetworkStatusService } from '../../../shared/api/network-status.service';
import { createOfflineApiError } from '../../../shared/api/api-error.utils';

/**
 * HTTP interceptor that fails API requests fast when the client is offline.
 *
 * @remarks
 * Uses `NetworkStatusService` (browser `online`/`offline` events). When the
 * client is known to be offline, requests are rejected immediately with a
 * classified offline `HttpApiError` instead of waiting for a transport error.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The observable, or an immediate offline error.
 */
export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const networkStatus = inject(NetworkStatusService);
  if (!networkStatus.online()) {
    return throwError(() => createOfflineApiError());
  }

  return next(req);
};
