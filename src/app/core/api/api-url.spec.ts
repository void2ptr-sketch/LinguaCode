import { buildApiUrl, buildFixtureUrl, isApiRequest } from './api-url';
import { environment } from '../../../environments/environment';

describe('api-url', () => {
  describe('buildApiUrl', () => {
    it('should prepend api base url to a relative path', () => {
      expect(buildApiUrl('cards/search')).toBe(`${environment.apiUrl}/cards/search`);
    });

    it('should not duplicate the leading slash', () => {
      expect(buildApiUrl('/cards/search')).toBe(`${environment.apiUrl}/cards/search`);
    });

    it('should handle root path', () => {
      expect(buildApiUrl('/')).toBe(`${environment.apiUrl}/`);
    });
  });

  describe('buildFixtureUrl', () => {
    it('should prepend fixtures base url to a relative path', () => {
      expect(buildFixtureUrl('content-manifest.json')).toBe(
        `${environment.fixturesUrl}/content-manifest.json`,
      );
    });

    it('should not duplicate the leading slash', () => {
      expect(buildFixtureUrl('/content-manifest.json')).toBe(
        `${environment.fixturesUrl}/content-manifest.json`,
      );
    });
  });

  describe('isApiRequest', () => {
    it('should return true for urls starting with the api base url', () => {
      expect(isApiRequest(`${environment.apiUrl}/scenarios/demo`)).toBe(true);
    });

    it('should return false for fixture urls', () => {
      expect(isApiRequest(`${environment.fixturesUrl}/select-cards.json`)).toBe(false);
    });

    it('should return false for unrelated urls', () => {
      expect(isApiRequest('https://example.com/api')).toBe(false);
    });
  });
});
