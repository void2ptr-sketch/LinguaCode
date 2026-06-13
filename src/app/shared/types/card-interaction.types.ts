export type CardFeedback = 'correct' | 'incorrect' | null;

export type CardAnswerState = {
  selectedIndex: number | null;
  answerText: string;
  memoryComplete: boolean;
  drawSubmitted: boolean;
};

export const createCardAnswerState = (): CardAnswerState => ({
  selectedIndex: null,
  answerText: '',
  memoryComplete: false,
  drawSubmitted: false,
});
