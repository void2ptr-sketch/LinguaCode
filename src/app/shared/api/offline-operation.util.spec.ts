import { HttpErrorResponse } from '@angular/common/http';
import { executeWithOfflineFallback } from './offline-operation.util';

/** Creates an HttpErrorResponse that classifies as a network error. */
const createNetworkError = (): HttpErrorResponse =>
  new HttpErrorResponse({
    status: 0,
    statusText: 'Network Error',
    error: new ProgressEvent('error'),
  });

/** Creates a generic non-network error. */
const createServerConflictError = () => new Error('Conflict');

describe('executeWithOfflineFallback', () => {
  it('should return true and execute operation when it succeeds', async () => {
    let called = false;
    const result = await executeWithOfflineFallback(
      () => {
        called = true;
        return Promise.resolve();
      },
      () => Promise.resolve(),
    );

    expect(result).toBe(true);
    expect(called).toBe(true);
  });

  it('should execute offline fallback when network error occurs', async () => {
    let onlineCalled = false;
    let offlineCalled = false;

    const result = await executeWithOfflineFallback(
      () => {
        onlineCalled = true;
        return Promise.reject(createNetworkError());
      },
      () => {
        offlineCalled = true;
        return Promise.resolve();
      },
    );

    expect(result).toBe(true);
    expect(onlineCalled).toBe(true);
    expect(offlineCalled).toBe(true);
  });

  it('should rethrow non-network errors', async () => {
    const error = createServerConflictError();

    await expect(
      executeWithOfflineFallback(
        () => Promise.reject(error),
        () => Promise.resolve(),
      ),
    ).rejects.toThrow('Conflict');
  });

  it('should pass return value from operation to caller', async () => {
    const result = await executeWithOfflineFallback(
      () => Promise.resolve({ id: '123', name: 'test' }),
      () => Promise.resolve(),
    );

    expect(result).toBe(true);
  });
});
