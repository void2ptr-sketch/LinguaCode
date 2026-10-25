import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  authInterceptor,
  authRefreshInterceptor,
  errorInterceptor,
  offlineInterceptor,
  retryInterceptor,
  timeoutInterceptor,
} from './interceptors';
import { cardsApiMockInterceptor } from '../../entities/card/api/mock/cards-api.mock.interceptor';
import { scenariosApiMockInterceptor } from '../../entities/scenario/api/mock/scenarios-api.mock.interceptor';
import { coursesApiMockInterceptor } from '../../entities/course/api/mock/courses-api.mock.interceptor';
import { programsApiMockInterceptor } from '../../entities/program/api/mock/programs-api.mock.interceptor';
import { scormExportMockInterceptor } from '../../entities/course/api/mock/scorm-export.mock.interceptor';

/**
 * Provides HTTP client configuration for the API layer.
 *
 * Registers `provideHttpClient` with fetch strategy and composes the
 * interceptor pipeline. Mock interceptors are included conditionally based
 * on environment flags; `authInterceptor` and `errorInterceptor` are always present.
 *
 * @returns An `EnvironmentProviders` configuration for Angular's HTTP client.
 */
export const provideApiHttp = () => {
  const interceptors = [
    ...(environment.useCardsApiMock ? [cardsApiMockInterceptor] : []),
    ...(environment.useScenariosApiMock ? [scenariosApiMockInterceptor] : []),
    ...(environment.useCoursesApiMock ? [coursesApiMockInterceptor] : []),
    ...(environment.useProgramsApiMock ? [programsApiMockInterceptor] : []),
    ...(environment.useScormMock ? [scormExportMockInterceptor] : []),
    offlineInterceptor,
    authRefreshInterceptor,
    authInterceptor,
    retryInterceptor,
    timeoutInterceptor,
    errorInterceptor,
  ];

  return provideHttpClient(withFetch(), withInterceptors(interceptors));
};

/**
 * Provides HTTP client configuration for testing.
 *
 * Unlike `provideApiHttp`, this function:
 * - Always enables mock interceptors (so smoke tests work without modifying `environment.ts`)
 * - Does NOT use `withFetch()` (HttpTestingController requires XMLHttpRequest backend)
 *
 * @returns An `EnvironmentProviders` configuration for Angular's HTTP client in tests.
 */
export const provideApiHttpTesting = (): EnvironmentProviders => {
  const interceptors = [
    cardsApiMockInterceptor,
    scenariosApiMockInterceptor,
    coursesApiMockInterceptor,
    programsApiMockInterceptor,
    scormExportMockInterceptor,
    offlineInterceptor,
    authRefreshInterceptor,
    authInterceptor,
    retryInterceptor,
    timeoutInterceptor,
    errorInterceptor,
  ];

  return provideHttpClient(withInterceptors(interceptors));
};
