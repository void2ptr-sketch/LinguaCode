import { describe, expect, it } from 'vitest';

import { findShuffledIndex, hashSeed, shuffleArray } from './card-shuffle.util';

describe('shuffleArray', () => {
  it('should return the same items when array has 0 elements', () => {
    const input: string[] = [];
    const result = shuffleArray(input);
    expect(result).toEqual([]);
    expect(result).not.toBe(input);
  });

  it('should return the same items when array has 1 element', () => {
    const input = ['only'];
    const result = shuffleArray(input);
    expect(result).toEqual(['only']);
    expect(result).not.toBe(input);
  });

  it('should preserve all original items after shuffle', () => {
    const input = ['A', 'B', 'C', 'D', 'E'];
    const result = shuffleArray(input);
    expect([...result].sort()).toEqual([...input].sort());
    expect(result).not.toBe(input);
  });

  it('should produce deterministic results with the same seed', () => {
    const input = ['A', 'B', 'C', 'D', 'E'];
    const result1 = shuffleArray(input, 'same-seed');
    const result2 = shuffleArray(input, 'same-seed');
    expect(result1).toEqual(result2);
  });

  it('should produce different results with different seeds', () => {
    const input = ['A', 'B', 'C', 'D', 'E'];
    const result1 = shuffleArray(input, 'seed-a');
    const result2 = shuffleArray(input, 'seed-b');
    // With 5 elements and different seeds, results should differ
    expect(result1).not.toEqual(result2);
  });

  it('should not return the original array reference', () => {
    const input = ['A', 'B', 'C'];
    const result = shuffleArray(input, 'deterministic');
    expect(result).not.toBe(input);
  });

  it('should work with number arrays', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input, 'num-seed');
    expect([...result].sort()).toEqual([...input].sort());
  });

  it('should work with object arrays (reference equality)', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = shuffleArray(items, 'obj-seed');
    expect(result.map((item) => item.id).sort()).toEqual([1, 2, 3]);
    // Just verify the shuffle produced a valid result with correct length
    expect(result.length).toBe(3);
  });
});

describe('findShuffledIndex', () => {
  it('should find the correct index after shuffle', () => {
    const original = ['A', 'B', 'C'];
    const shuffled = ['C', 'A', 'B'];
    expect(findShuffledIndex(original, shuffled, 0)).toBe(1); // A moved from 0 to 1
    expect(findShuffledIndex(original, shuffled, 1)).toBe(2); // B moved from 1 to 2
    expect(findShuffledIndex(original, shuffled, 2)).toBe(0); // C moved from 2 to 0
  });

  it('should return the same index when array is not shuffled', () => {
    const original = ['X', 'Y', 'Z'];
    expect(findShuffledIndex(original, original, 0)).toBe(0);
    expect(findShuffledIndex(original, original, 1)).toBe(1);
    expect(findShuffledIndex(original, original, 2)).toBe(2);
  });
});

describe('hashSeed', () => {
  it('should produce a consistent hash for the same string', () => {
    expect(hashSeed('test-seed')).toBe(hashSeed('test-seed'));
  });

  it('should produce different hashes for different strings', () => {
    expect(hashSeed('seed-a')).not.toBe(hashSeed('seed-b'));
  });

  it('should produce a 32-bit integer', () => {
    const hash = hashSeed('any-string');
    expect(hash).toBeGreaterThan(-2147483648);
    expect(hash).toBeLessThanOrEqual(2147483647);
  });
});
