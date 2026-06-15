import {
  normalizeLearningSessionPreferences,
  resolveLearningSessionForPair,
} from './learning-session.utils';
import { createUserLanguagePairEntry } from './user-language-pair.utils';

describe('learning-session.utils', () => {
  it('should normalize learning session ids', () => {
    const prefs = normalizeLearningSessionPreferences({
      activeCourseId: ' demo-course ',
      lastScenarioId: 'demo-scenario',
    });

    expect(prefs).toEqual({
      activeCourseId: 'demo-course',
      lastScenarioId: 'demo-scenario',
    });
  });

  it('should drop empty ids', () => {
    expect(normalizeLearningSessionPreferences({ activeCourseId: '  ' })).toBeUndefined();
  });

  it('should resolve learning session from pair entry', () => {
    const entry = createUserLanguagePairEntry(
      { known: 'ru', learning: 'en' },
      'pair-1',
      undefined,
      { learning: { activeCourseId: 'demo-course' } },
    );

    expect(resolveLearningSessionForPair(entry).activeCourseId).toBe('demo-course');
  });
});
