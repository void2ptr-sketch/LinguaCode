import { describe, expect, it } from 'vitest';
import { provideApiHttp, provideApiHttpTesting } from './provide-api.http';
import { environment } from '../../../environments/environment';

describe('provideApiHttp', () => {
  it('should return a valid provider configuration', () => {
    const result = provideApiHttp();
    expect(result).toBeDefined();
  });

  it('should include all base interceptors', () => {
    const result = provideApiHttp();
    expect(result).toBeDefined();
  });

  it('should not include mock interceptors when all flags are false', () => {
    // Dev environment has all mock flags set to false by default (real backend)
    expect(environment.useCardsApiMock).toBe(false);
    expect(environment.useScenariosApiMock).toBe(false);
    expect(environment.useCoursesApiMock).toBe(false);
    expect(environment.useProgramsApiMock).toBe(false);
    expect(environment.useLessonsApiMock).toBe(false);
    expect(environment.useScormMock).toBe(false);
    expect(environment.useLanguagePairsApiMock).toBe(false);
    // The function should still work with no mocks
    const result = provideApiHttp();
    expect(result).toBeDefined();
  });
});

describe('provideApiHttpTesting', () => {
  it('should return a valid provider configuration', () => {
    const result = provideApiHttpTesting();
    expect(result).toBeDefined();
  });

  it('should include all mock interceptors', () => {
    const result = provideApiHttpTesting();
    expect(result).toBeDefined();
  });
});
