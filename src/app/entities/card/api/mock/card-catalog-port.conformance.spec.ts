import type { CardCatalogPort } from '../../repository/card-catalog.port';
import { CardsApiService } from '../cards-api.service';
import { CardsCatalogMockHandler } from './cards-catalog.mock.handler';

/**
 * Compile-time contract conformance.
 *
 * Both the API service (real backend path) and the mock handler (dev backend
 * path) must satisfy the `CardCatalogPort` contract. A mismatch produces a
 * compile-time error, so a mock/real backend can be swapped without touching
 * consumers.
 */
type ApiServiceConforms = CardsApiService extends CardCatalogPort ? true : false;
type MockHandlerConforms = CardsCatalogMockHandler extends CardCatalogPort ? true : false;

const apiServiceConforms: ApiServiceConforms = true;
const mockHandlerConforms: MockHandlerConforms = true;

describe('CardCatalogPort conformance', () => {
  it('CardsApiService implements the port contract', () => {
    expect(apiServiceConforms).toBe(true);
  });

  it('CardsCatalogMockHandler implements the port contract', () => {
    expect(mockHandlerConforms).toBe(true);
  });
});
