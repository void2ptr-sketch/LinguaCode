import type { PhoneticLexeme } from '../phonetics/phonetic-content.types';

/**
 * Result of resolving an option card for the active session direction.
 *
 * @remarks
 * Produced by `resolveOptionCard` in card-direction utils; contains
 * direction-normalized prompt/options independent of the original card shape.
 */
export type ResolvedOptionCard = {
  prompt: string;
  promptLexeme?: PhoneticLexeme;
  options: readonly string[];
  optionLexemes?: readonly (PhoneticLexeme | undefined)[];
  correctIndex: number;
};

/**
 * Result of resolving a memory pair for the active session direction.
 *
 * @remarks
 * Produced by `resolveMemoryPairs` in card-direction utils; `left`/`right`
 * fields are swapped according to the session direction.
 */
export type ResolvedMemoryPair = {
  left: string;
  right: string;
  leftLexeme?: PhoneticLexeme;
  rightLexeme?: PhoneticLexeme;
  pairId: string;
};
