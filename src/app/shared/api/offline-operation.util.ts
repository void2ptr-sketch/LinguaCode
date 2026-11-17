import { isNetworkError, isOfflineError } from './api-error.utils';

/**
 * Wrapper that executes an async operation and falls back to an offline handler
 * when the error is classified as offline or network-related.
 *
 * @param operation — async function to execute online
 * @param offlineFallback — async function to execute when offline / network error
 * @returns `true` on success, `false` otherwise
 *
 * @example
 * ```ts
 * const success = await executeWithOfflineFallback(
 *   () => cardsApi.create(card),
 *   () => syncQueue.enqueue('card.create', { card }),
 * );
 * ```
 */
export async function executeWithOfflineFallback<T>(
  operation: () => Promise<T>,
  offlineFallback: () => Promise<void>,
): Promise<boolean> {
  try {
    await operation();
    return true;
  } catch (error) {
    if (isOfflineError(error) || isNetworkError(error)) {
      await offlineFallback();
      return true;
    }
    throw error;
  }
}
