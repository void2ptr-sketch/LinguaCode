export type QuizQuestionHeaderMode = 'title-only' | 'prompt-only';

/** В режиме обучения ученик видит вопрос (prompt), не служебное название карточки. */
export function resolveQuizQuestionHeaderDisplay(
  title: string,
  prompt: string,
): QuizQuestionHeaderMode {
  return prompt.trim() ? 'prompt-only' : 'title-only';
}

export function quizQuestionPromptText(title: string, prompt: string): string {
  return resolveQuizQuestionHeaderDisplay(title, prompt) === 'prompt-only' ? prompt.trim() : title.trim();
}
