import type { ProgramCatalogPort } from '../../repository/program-catalog.port';
import { ProgramsApiService } from '../programs-api.service';
import { ProgramsCatalogMockHandler } from './programs-catalog.mock.handler';

/**
 * Compile-time contract conformance.
 *
 * Both the API service (real backend path) and the mock handler (dev backend
 * path) must satisfy the `ProgramCatalogPort` contract. A mismatch produces a
 * compile-time error, so a mock/real backend can be swapped without touching
 * consumers.
 */
type ApiServiceConforms = ProgramsApiService extends ProgramCatalogPort ? true : false;
type MockHandlerConforms = ProgramsCatalogMockHandler extends ProgramCatalogPort ? true : false;

const apiServiceConforms: ApiServiceConforms = true;
const mockHandlerConforms: MockHandlerConforms = true;

describe('ProgramCatalogPort conformance', () => {
  it('ProgramsApiService implements the port contract', () => {
    expect(apiServiceConforms).toBe(true);
  });

  it('ProgramsCatalogMockHandler implements the port contract', () => {
    expect(mockHandlerConforms).toBe(true);
  });
});
