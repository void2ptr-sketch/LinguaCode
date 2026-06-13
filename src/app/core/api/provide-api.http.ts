import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

export const provideApiHttp = () =>
  provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor]));
