import type { CardFeedback } from '../../types/card-interaction.types';

/**
 * Builds a CSS class string for an option button based on selection and feedback state.
 *
 * @param index - The zero-based index of the option.
 * @param selectedIndex - The index of the user's selected option (null if none).
 * @param feedback - The feedback state ('correct', 'incorrect', or null).
 * @param correctIndex - The index of the correct option.
 * @returns A space-separated string of CSS classes (e.g. "option option--selected option--correct").
 */
export const buildOptionClass = (
  index: number,
  selectedIndex: number | null,
  feedback: CardFeedback,
  correctIndex: number,
): string => {
  const classes = ['option'];

  if (selectedIndex === index) {
    classes.push('option--selected');
  }

  if (feedback !== null) {
    if (index === correctIndex) {
      classes.push('option--correct');
    } else if (selectedIndex === index) {
      classes.push('option--incorrect');
    }
  }

  return classes.join(' ');
};
