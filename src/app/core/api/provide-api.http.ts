import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { cardsApiMockInterceptor } from './cards/cards-api.mock.interceptor';
import { scenariosApiMockInterceptor } from './scenarios/scenarios-api.mock.interceptor';
import { coursesApiMockInterceptor } from './courses/courses-api.mock.interceptor';
import { errorInterceptor } from './error.interceptor';

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
