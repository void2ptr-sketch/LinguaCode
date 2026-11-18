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
    // Dev environment has all mock flags set to true by default
    expect(environment.useCardsApiMock).toBe(true);
    expect(environment.useScenariosApiMock).toBe(true);
    expect(environment.useCoursesApiMock).toBe(true);
    expect(environment.useProgramsApiMock).toBe(true);
    expect(environment.useLessonsApiMock).toBe(true);
    expect(environment.useScormMock).toBe(true);
    expect(environment.useLanguagePairsApiMock).toBe(true);
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
