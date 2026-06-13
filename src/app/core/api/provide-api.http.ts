import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { cardsApiMockInterceptor } from './cards-api.mock.interceptor';
import { scenariosApiMockInterceptor } from './scenarios-api.mock.interceptor';
import { errorInterceptor } from './error.interceptor';

export const provideApiHttp = () => {
  const interceptors = [
    ...(environment.useCardsApiMock ? [cardsApiMockInterceptor] : []),
    ...(environment.useScenariosApiMock ? [scenariosApiMockInterceptor] : []),
    authInterceptor,
    errorInterceptor,
  ];

  return provideHttpClient(withFetch(), withInterceptors(interceptors));
};
