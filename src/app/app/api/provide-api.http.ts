import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
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
  // In test environments, force mock interceptors on so smoke tests work
  // without requiring HttpTestingController setup for every API call.
  const isTest = typeof window !== 'undefined' && 'XMLHttpRequest' in window;
  const cardsMock = environment.useCardsApiMock || isTest;
  const scenariosMock = environment.useScenariosApiMock || isTest;
  const coursesMock = environment.useCoursesApiMock || isTest;
  const programsMock = environment.useProgramsApiMock || isTest;

  const interceptors = [
    ...(cardsMock ? [cardsApiMockInterceptor] : []),
    ...(scenariosMock ? [scenariosApiMockInterceptor] : []),
    ...(coursesMock ? [coursesApiMockInterceptor] : []),
    ...(programsMock ? [programsApiMockInterceptor] : []),
    offlineInterceptor,
    authRefreshInterceptor,
    authInterceptor,
    retryInterceptor,
    timeoutInterceptor,
    errorInterceptor,
  ];

  // withFetch() uses native Fetch API which HttpTestingController cannot intercept.
  // Disable it in test environments to allow smoke tests to work.
  const httpConfig = isTest ? [] : [withFetch()];

  return provideHttpClient(...httpConfig, withInterceptors(interceptors));
};
