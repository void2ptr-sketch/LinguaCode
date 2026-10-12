export { ClientApi as ApiClient } from '../../app/api/clients/client-api.service';
export { AUTH_TOKEN_STORAGE_KEY, authInterceptor } from '../../app/api/interceptors';
export {
  getApiErrorMessage,
  isHttpApiError,
  parseApiErrorBody,
  toHttpApiError,
} from '../../app/api/errors/api-error.utils';
export { buildApiUrl, buildFixtureUrl, isApiRequest } from '../../shared/api/api-url';
export type { ApiErrorBody, ApiListResponse, ApiResponse, HttpApiError } from '../../shared/api/api.types';
export { buildCardSearchParams, parseCardSearchCriteria } from '../../entities/card/api/mock/cards-api.params.utils';
export {
  buildCourseSearchParams,
  parseCourseSearchCriteria,
} from '../../entities/course/api/mock/courses-api.params.utils';
export {
  buildScenarioSearchParams,
  parseScenarioSearchCriteria,
} from '../../entities/scenario/api/mock/scenarios-api.params.utils';
export { cardsApiMockInterceptor } from '../../entities/card/api/mock';
export { coursesApiMockInterceptor } from '../../entities/course/api/mock';
export { scenariosApiMockInterceptor } from '../../entities/scenario/api/mock';
export { CardsCatalogMockHandler } from '../../entities/card/api/mock';
export { CoursesCatalogMockHandler } from '../../entities/course/api/mock';
export { ScenariosCatalogMockHandler } from '../../entities/scenario/api/mock';
export { errorInterceptor } from '../../app/api/interceptors';
export { provideApiHttp } from '../../app/api/provide-api.http';
