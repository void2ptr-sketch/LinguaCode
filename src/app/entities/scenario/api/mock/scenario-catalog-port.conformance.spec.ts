import type { ScenarioCatalogPort } from '../../repository/scenario-catalog.port';
import { ScenariosApiService } from '../scenarios-api.service';
import { ScenariosCatalogMockHandler } from './scenarios-catalog.mock.handler';

/**
 * Compile-time contract conformance.
 *
 * Both the API service (real backend path) and the mock handler (dev backend
 * path) must satisfy the `ScenarioCatalogPort` contract. A mismatch produces a
 * compile-time error, so a mock/real backend can be swapped without touching
 * consumers.
 */
type ApiServiceConforms = ScenariosApiService extends ScenarioCatalogPort ? true : false;
type MockHandlerConforms = ScenariosCatalogMockHandler extends ScenarioCatalogPort ? true : false;

const apiServiceConforms: ApiServiceConforms = true;
const mockHandlerConforms: MockHandlerConforms = true;

describe('ScenarioCatalogPort conformance', () => {
  it('ScenariosApiService implements the port contract', () => {
    expect(apiServiceConforms).toBe(true);
  });

  it('ScenariosCatalogMockHandler implements the port contract', () => {
    expect(mockHandlerConforms).toBe(true);
  });
});
