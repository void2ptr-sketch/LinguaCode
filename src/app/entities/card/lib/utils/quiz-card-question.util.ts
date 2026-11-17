/**
 * Display mode for quiz question headers.
 *
 * @remarks
 * `title-only` — show the card's title; `prompt-only` — show the card's prompt text.
 */
export type QuizQuestionHeaderMode = 'title-only' | 'prompt-only';

/**
 * Determines which text to display as the quiz question header.
 *
 * @param title - The card's title.
 * @param prompt - The card's prompt text.
 * @returns `'prompt-only'` if prompt is non-empty, `'title-only'` otherwise.
 *
 * @remarks
 * In learning mode, students see the prompt (question) rather than the card title.
 */
export function resolveQuizQuestionHeaderDisplay(
  title: string,
  prompt: string,
): QuizQuestionHeaderMode {
  return prompt.trim() ? 'prompt-only' : 'title-only';
}

/**
 * Returns the display text for the quiz question prompt.
 *
 * @param title - The card's title.
 * @param prompt - The card's prompt text.
 * @returns The prompt text if available, otherwise the title.
 */
export function quizQuestionPromptText(title: string, prompt: string): string {
  return resolveQuizQuestionHeaderDisplay(title, prompt) === 'prompt-only'
    ? prompt.trim()
    : title.trim();
}
