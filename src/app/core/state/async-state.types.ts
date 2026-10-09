/**
 * Generic async state holder for UI loading, data, and error tracking.
 *
 * @typeParam T - The type of the loaded data.
 */
export type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
};

export const createAsyncState = <T>(data: T): AsyncState<T> => ({
  data,
  loading: false,
  error: null,
});

export const setAsyncLoading = <T>(state: AsyncState<T>): AsyncState<T> => ({
  ...state,
  loading: true,
  error: null,
});

export const setAsyncSuccess = <T>(state: AsyncState<T>, data: T): AsyncState<T> => ({
  data,
  loading: false,
  error: null,
});

export const setAsyncError = <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
  ...state,
  loading: false,
  error,
});
