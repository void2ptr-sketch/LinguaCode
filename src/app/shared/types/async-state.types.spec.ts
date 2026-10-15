import { describe, expect, it } from 'vitest';
import {
  createAsyncState,
  runAsyncState,
  setAsyncError,
  setAsyncLoading,
  setAsyncSuccess,
  type AsyncState,
} from './async-state.types';

describe('async-state.types', () => {
  it('should create an idle state', () => {
    const state = createAsyncState([] as string[]);
    expect(state).toEqual({ data: [], loading: false, error: null });
  });

  it('should set loading state', () => {
    const state = setAsyncLoading(createAsyncState([] as string[]));
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should set success state', () => {
    const state = setAsyncSuccess(createAsyncState([] as string[]), ['a']);
    expect(state).toEqual({ data: ['a'], loading: false, error: null });
  });

  it('should set error state', () => {
    const state = setAsyncError(createAsyncState([] as string[]), 'boom');
    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });

  describe('runAsyncState', () => {
    it('should transition to success on resolve', async () => {
      const next = await runAsyncState(createAsyncState([] as string[]), async () => ['a', 'b']);

      expect(next).toEqual({ data: ['a', 'b'], loading: false, error: null });
    });

    it('should transition to error on reject with classified message', async () => {
      const next = await runAsyncState(createAsyncState([] as string[]), async () => {
        throw new Error('Network failure');
      });

      expect(next.loading).toBe(false);
      expect(next.error).not.toBeNull();
    });

    it('should use fallback message for non-Error failures', async () => {
      const next = await runAsyncState(
        createAsyncState([] as string[]),
        async () => {
          throw { code: 500 };
        },
        'Своё сообщение',
      );

      expect(next.error).toBe('Своё сообщение');
    });

    it('should keep previous data on error', async () => {
      const state: AsyncState<string[]> = { data: ['old'], loading: false, error: null };
      const next = await runAsyncState(state, async () => {
        throw new Error('boom');
      });

      expect(next.data).toEqual(['old']);
      expect(next.error).not.toBeNull();
    });
  });
});