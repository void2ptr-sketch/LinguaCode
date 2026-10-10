import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './interceptors';
import { cardsApiMockInterceptor } from './cards/cards-api.mock.interceptor';
import { scenariosApiMockInterceptor } from './scenarios/scenarios-api.mock.interceptor';
import { coursesApiMockInterceptor } from './courses/courses-api.mock.interceptor';
import { errorInterceptor } from './interceptors';

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
    authInterceptor,
    errorInterceptor,
  ];

  return provideHttpClient(withFetch(), withInterceptors(interceptors));
};
