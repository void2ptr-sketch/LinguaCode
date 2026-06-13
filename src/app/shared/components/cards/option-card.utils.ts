import { CardFeedback } from '../../types';

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
