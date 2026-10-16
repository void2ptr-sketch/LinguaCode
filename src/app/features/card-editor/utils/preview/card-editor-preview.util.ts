import type { Card } from '../../../../entities/card/model';
import type { CardDraft } from '../../types/card-draft.types';
import { DEFAULT_CARD_DIRECTION } from '../../types/card-draft.types';
import { DEFAULT_TONE_OPTIONS } from '../../../../entities/chinese/lib/answers/tone-mark.utils';

/**
 * Creates a synthetic fallback card for preview purposes when normalization fails.
 *
 * @remarks
 * Provides sensible default content for each card kind so the preview panel
 * always renders something meaningful even before the user fills in the form.
 *
 * @param draft - The incomplete card draft.
 * @param previewId - The identifier for the preview card element.
 * @returns A partially-populated `Card` instance matching the draft's kind.
 */
export function fallbackPreviewCard(draft: CardDraft, previewId: string): Card {
  const appearance = draft.appearance;

  switch (draft.kind) {
    case 'select':
      return {
        id: previewId,
        kind: 'select',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Hint',
        optionsLearning: ['Option 1', 'Option 2'],
        optionsKnown: ['Answer 1', 'Answer 2'],
        correctIndex: 0,
        appearance,
      };

    case 'code-select':
      return {
        id: previewId,
        kind: 'code-select',
        title: draft.title || 'New card',
        caption: draft.caption || undefined,
        prompt: {
          code: draft.prompt?.code || 'print "Hello";',
          language: draft.prompt?.language,
        },
        options: [
          { code: '// option 1', language: 'typescript' },
          { code: '// option 2', language: 'typescript' },
        ],
        correctIndex: 0,
        appearance,
      };

    case 'memory':
      return {
        id: previewId,
        kind: 'memory',
        title: draft.title || 'New card',
        promptKnown: draft.promptKnown || 'Hint',
        pairs: [
          {
            known: 'A',
            learning: 'B',
            learningLexeme: { primary: '', audioUrl: '', script: 'latn' },
          },
        ],
        appearance,
      };

    case 'symbol':
      return {
        id: previewId,
        kind: 'symbol',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Hint',
        symbols: ['\ud83d\udc4b', '\ud83d\udd25'],
        correctIndex: 0,
        appearance,
      };

    case 'sound':
      return {
        id: previewId,
        kind: 'sound',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Hint',
        audioLabelLearning: draft.audioLabelLearning || 'Hello',
        optionsKnown: ['Hi', 'Bye'],
        correctIndex: 0,
        appearance,
      };

    case 'timed':
      return {
        id: previewId,
        kind: 'timed',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Hint',
        optionsLearning: ['A', 'B'],
        correctIndex: 0,
        timeLimitSec: draft.timeLimitSec || 30,
        appearance,
      };

    case 'keyboard':
      return {
        id: previewId,
        kind: 'keyboard',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Hint',
        acceptedAnswersKnown: ['answer'],
        appearance,
      };

    case 'draw':
      return {
        id: previewId,
        kind: 'draw',
        title: draft.title || 'New card',
        promptKnown: draft.promptKnown || 'Hint',
        referenceHintKnown: draft.referenceHintKnown || 'Reference',
        practiceMode: draft.practiceMode ?? 'freehand',
        targetCharacter: draft.targetCharacter || (draft.promptLexeme?.primary ?? ''),
        radicalHint: draft.radicalHint,
        appearance,
      };

    case 'tone':
      return {
        id: previewId,
        kind: 'tone',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'Which tone?',
        syllableBase: draft.syllableBase || 'ma',
        toneOptions: [...DEFAULT_TONE_OPTIONS],
        correctIndex: 0,
        appearance,
      };

    case 'reading':
      return {
        id: previewId,
        kind: 'reading',
        title: draft.title || 'New card',
        direction: draft.direction ?? DEFAULT_CARD_DIRECTION,
        promptKnown: draft.promptKnown || 'What is the reading?',
        optionsLearning: ['\u9280\u884c', 'y\u00ednx\u00edng'],
        correctIndex: 0,
        appearance,
      };

    default: {
      // Exhaustive switch: draft is narrowed to never here
      const _draft = draft as CardDraft;
      return {
        id: previewId,
        kind: 'select' as const,
        title: _draft.title || 'New card',
        direction: DEFAULT_CARD_DIRECTION,
        promptKnown: (_draft as { promptKnown?: string }).promptKnown || 'Hint',
        optionsLearning: ['Option 1', 'Option 2'],
        optionsKnown: ['Answer 1', 'Answer 2'],
        correctIndex: 0,
        appearance,
      } as unknown as Card;
    }
  }
}
