import type { CourseCatalogPort } from '../../repository/course-catalog.port';
import { CoursesApiService } from '../courses-api.service';
import { CoursesCatalogMockHandler } from './courses-catalog.mock.handler';

/**
 * Compile-time contract conformance.
 *
 * Both the API service (real backend path) and the mock handler (dev backend
 * path) must satisfy the `CourseCatalogPort` contract. A mismatch produces a
 * compile-time error, so a mock/real backend can be swapped without touching
 * consumers.
 */
type ApiServiceConforms = CoursesApiService extends CourseCatalogPort ? true : false;
type MockHandlerConforms = CoursesCatalogMockHandler extends CourseCatalogPort ? true : false;

const apiServiceConforms: ApiServiceConforms = true;
const mockHandlerConforms: MockHandlerConforms = true;

describe('CourseCatalogPort conformance', () => {
  it('CoursesApiService implements the port contract', () => {
    expect(apiServiceConforms).toBe(true);
  });

  it('CoursesCatalogMockHandler implements the port contract', () => {
    expect(mockHandlerConforms).toBe(true);
  });
});
