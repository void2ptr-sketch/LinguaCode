export { ClientApi as ApiClient } from './clients/client-api.service';
export { AUTH_TOKEN_STORAGE_KEY, authInterceptor } from './interceptors';
export {
  getApiErrorMessage,
  isHttpApiError,
  parseApiErrorBody,
  toHttpApiError,
} from './errors/api-error.utils';
export { buildApiUrl, buildFixtureUrl, isApiRequest } from './api-url';
export type { ApiErrorBody, ApiListResponse, ApiResponse, HttpApiError } from './api.types';
export { buildCardSearchParams, parseCardSearchCriteria } from './cards/cards-api.params.utils';
export {
  buildCourseSearchParams,
  parseCourseSearchCriteria,
} from './courses/courses-api.params.utils';
export {
  buildScenarioSearchParams,
  parseScenarioSearchCriteria,
} from './scenarios/scenarios-api.params.utils';
export { cardsApiMockInterceptor } from './cards';
export { coursesApiMockInterceptor } from './courses';
export { scenariosApiMockInterceptor } from './scenarios';
export { CardsCatalogMockHandler } from './cards';
export { CoursesCatalogMockHandler } from './courses';
export { ScenariosCatalogMockHandler } from './scenarios';
export { errorInterceptor } from './interceptors';
export { provideApiHttp } from './provide-api.http';
