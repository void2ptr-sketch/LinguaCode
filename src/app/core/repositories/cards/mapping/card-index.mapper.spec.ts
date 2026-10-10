import { cardToIndexEntry } from './card-index.mapper';

describe('card-index.mapper', () => {
  it('should add ipa tag and readings from card lexemes', () => {
    const entry = cardToIndexEntry({
      id: 'select-en-ipa-1',
      kind: 'select',
      title: 'Hello (IPA)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Как звучит слово «Hello»?',
      optionsLearning: ['Hello'],
      optionsLexemes: [{ primary: 'Hello', script: 'latn', ipa: 'həˈləʊ' }],
      correctIndex: 0,
    });

    expect(entry.tags).toContain('ipa');
    expect(entry.ipaReadings).toEqual(['həˈləʊ']);
  });

  it('should keep explicit meta tags and append ipa when needed', () => {
    const entry = cardToIndexEntry(
      {
        id: 'keyboard-en-ipa-1',
        kind: 'keyboard',
        title: 'Hello (IPA ввод)',
        appearance: { theme: 'azure-blue', fontSize: 'md' },
        direction: 'known-to-learning',
        promptKnown: 'Введите IPA',
        acceptedAnswersKnown: ['həˈləʊ'],
        answerMode: 'ipa',
      },
      {
        tags: ['keyboard', 'phonetics'],
      },
    );

    expect(entry.tags).toEqual(['keyboard', 'phonetics', 'ipa']);
    expect(entry.ipaReadings).toEqual(['həˈləʊ']);
  });
});
