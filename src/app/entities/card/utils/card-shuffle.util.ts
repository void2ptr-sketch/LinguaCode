/**
 * Fisher-Yates shuffle with optional seed for deterministic results.
 *
 * @remarks
 * When `seed` is provided, the shuffle produces the same order every time
 * for the same input array and seed. When omitted, uses `Math.random()`.
 * The original array is never mutated — a copy is always returned.
 */
export function shuffleArray<T>(items: readonly T[], seed?: string | number): readonly T[] {
  if (items.length <= 1) return [...items];

  const copy = [...items];
  const hashed = typeof seed === 'string' ? hashSeed(seed) : (seed ?? 0);
  const random = hashed !== 0 ? seededRandom(hashed) : () => Math.random();

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/**
 * Returns the index of `originalItem` inside a shuffled copy of `items`.
 *
 * @remarks
 * Useful for adjusting `correctIndex` after shuffling: pass the original
 * options array, the shuffled result, and the original correct index
 * to find the new position of the correct option.
 */
export function findShuffledIndex<T>(
  original: readonly T[],
  shuffled: readonly T[],
  originalIndex: number,
): number {
  const originalItem = original[originalIndex];
  return shuffled.indexOf(originalItem);
}

/** Mulberry32 PRNG — deterministic, fast, good enough for UI shuffling. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string into a 32-bit integer for use as a PRNG seed. */
export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
