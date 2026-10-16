import { getApiErrorMessage } from '../api/api-error.utils';

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

/**
 * Выполняет асинхронную операцию, прогоняя `AsyncState` по этапам
 * loading → success / error.
 *
 * Это RemoteData-обёртка для Promise-based API-сервисов: стор вызывает
 * `runAsyncState` вместо ручного управления `loading`/`error`.
 *
 * @typeParam T - Тип загружаемых данных.
 * @param state - Текущее состояние.
 * @param task - Асинхронная операция, возвращающая данные.
 * @param fallbackMessage - Сообщение об ошибке, если классифицировать не удалось.
 * @returns Новое состояние после завершения операции.
 *
 * @example
 * ```typescript
 * async load(): Promise<void> {
 *   this.#state.set(await runAsyncState(this.#state(), () => this.api.search(criteria)));
 * }
 * ```
 */
export async function runAsyncState<T>(
  state: AsyncState<T>,
  task: () => Promise<T>,
  fallbackMessage = 'Не удалось выполнить операцию',
): Promise<AsyncState<T>> {
  const loading = setAsyncLoading(state);
  try {
    const data = await task();
    return setAsyncSuccess(loading, data);
  } catch (error) {
    return setAsyncError(loading, getApiErrorMessage(error, fallbackMessage));
  }
}
