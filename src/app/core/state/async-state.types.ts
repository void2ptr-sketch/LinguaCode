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

/**
 * Creates a new `AsyncState` with the given data.
 *
 * @typeParam T - The type of the loaded data.
 * @param data - The initial data value.
 * @returns An `AsyncState` with `loading: false` and `error: null`.
 */
export const createAsyncState = <T>(data: T): AsyncState<T> => ({
  data,
  loading: false,
  error: null,
});

/**
 * Sets an `AsyncState` to the loading state.
 *
 * @typeParam T - The type of the loaded data.
 * @param state - The current async state.
 * @returns A new `AsyncState` with `loading: true` and `error: null`.
 */
export const setAsyncLoading = <T>(state: AsyncState<T>): AsyncState<T> => ({
  ...state,
  loading: true,
  error: null,
});

/**
 * Sets an `AsyncState` to the success state with new data.
 *
 * @typeParam T - The type of the loaded data.
 * @param state - The current async state.
 * @param data - The new data value.
 * @returns A new `AsyncState` with `loading: false`, updated `data`, and `error: null`.
 */
export const setAsyncSuccess = <T>(state: AsyncState<T>, data: T): AsyncState<T> => ({
  data,
  loading: false,
  error: null,
});

/**
 * Sets an `AsyncState` to the error state.
 *
 * @typeParam T - The type of the loaded data.
 * @param state - The current async state.
 * @param error - The error message.
 * @returns A new `AsyncState` with `loading: false` and the given `error`.
 */
export const setAsyncError = <T>(state: AsyncState<T>, error: string): AsyncState<T> => ({
  ...state,
  loading: false,
  error,
});
