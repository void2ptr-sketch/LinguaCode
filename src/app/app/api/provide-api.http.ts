import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
import { lessonsApiMockInterceptor } from '../../entities/lesson/api/mock/lessons-api.mock.interceptor';
import { scormExportMockInterceptor } from '../../entities/course/api/mock/scorm-export.mock.interceptor';

/**
 * Provides HTTP client configuration for the API layer.
 *
 * Registers `provideHttpClient` and composes the interceptor pipeline.
 * Mock interceptors are included conditionally based on environment flags;
 * `authInterceptor` and `errorInterceptor` are always present.
 *
 * @returns An `EnvironmentProviders` configuration for Angular's HTTP client.
 */
export const provideApiHttp = () => {
  // ── Mock lock: prevent accidental mock usage during backend integration ──
  const mockFlags: Record<string, boolean> = {
    useCardsApiMock: environment.useCardsApiMock,
    useScenariosApiMock: environment.useScenariosApiMock,
    useCoursesApiMock: environment.useCoursesApiMock,
    useProgramsApiMock: environment.useProgramsApiMock,
    useLessonsApiMock: environment.useLessonsApiMock,
    useScormMock: environment.useScormMock,
    useLanguagePairsApiMock: environment.useLanguagePairsApiMock,
    useAuthApiMock: environment.useAuthApiMock,
  };

  const enabledMocks = Object.entries(mockFlags).filter(([, v]) => v);
  if (enabledMocks.length > 0) {
    const msg = `Mock API interceptors are ENABLED — backend integration in progress:\n  ${enabledMocks.map(([k]) => `  - ${k}`).join('\n  ')}`;
    console.error('[LinguaCode] ' + msg);
    throw new Error(msg);
  }

  const interceptors = [
    offlineInterceptor,
    authRefreshInterceptor,
    authInterceptor,
    retryInterceptor,
    timeoutInterceptor,
    errorInterceptor,
  ];

  return provideHttpClient(withInterceptors(interceptors));
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
    lessonsApiMockInterceptor,
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
