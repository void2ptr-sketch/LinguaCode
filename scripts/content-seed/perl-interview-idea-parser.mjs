/** Parse «Идея программы» markdown: Этап → урок, вопрос → сценарий. */

const STAGE_HEADING = /^##\s+Этап\s*(?:\d+\s*)?[:\-.]?\s*(.+)$/i;

const METADATA_HEADINGS = new Set([
  'цели',
  'аудитория',
  'формат',
  'идея программы',
]);

/**
 * @returns {{ title: string, questions: string[] }[]}
 */
export function parsePerlInterviewIdea(markdown) {
  if (!markdown?.trim()) {
    return [];
  }

  const withoutComments = markdown.replace(/<!--[\s\S]*?-->/g, '');

  /** @type {{ title: string, questions: string[] }[]} */
  const stages = [];
  let currentStage = null;

  for (const rawLine of withoutComments.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (/^#\s+/.test(line) && !STAGE_HEADING.test(line)) {
      continue;
    }

    const stageMatch = line.match(STAGE_HEADING);
    if (stageMatch) {
      currentStage = {
        title: stageMatch[1].trim(),
        questions: [],
      };
      stages.push(currentStage);
      continue;
    }

    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      const sectionKey = sectionMatch[1].trim().split(':')[0].trim().toLowerCase();
      if (METADATA_HEADINGS.has(sectionKey)) {
        currentStage = null;
      }
      continue;
    }

    const questionMatch = line.match(/^-\s+(.+)$/);
    if (questionMatch && currentStage) {
      currentStage.questions.push(questionMatch[1].trim());
    }
  }

  return stages.filter((stage) => stage.questions.length > 0);
}
