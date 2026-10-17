import { collectCardIpaReadings, collectLexemeIpaReadings } from './card-ipa-index.utils';

describe('card-ipa-index.utils', () => {
  it('should collect ipa variants from lexeme', () => {
    expect(
      collectLexemeIpaReadings({
        primary: 'thought',
        script: 'latn',
        ipa: [
          { label: 'BrE', transcription: 'θɔːt' },
          { label: 'AmE', transcription: 'θɑːt' },
        ],
      }),
    ).toEqual(['θɔːt', 'θɑːt']);
  });

  it('should collect ipa from select card options', () => {
    const readings = collectCardIpaReadings({
      id: 'select-en-ipa-1',
      kind: 'select',
      title: 'Hello (IPA)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Как звучит слово «Hello»?',
      optionsLearning: ['Hello', 'Goodbye', 'Thanks'],
      optionsLexemes: [
        { primary: 'Hello', script: 'latn', ipa: 'həˈləʊ' },
        { primary: 'Goodbye', script: 'latn', ipa: 'ɡʊdˈbaɪ' },
      ],
      correctIndex: 0,
    });

    expect(readings).toContain('həˈləʊ');
    expect(readings).toContain('ɡʊdˈbaɪ');
  });

  it('should collect ipa keyboard accepted answers', () => {
    const readings = collectCardIpaReadings({
      id: 'keyboard-en-ipa-1',
      kind: 'keyboard',
      title: 'Hello (IPA ввод)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      direction: 'known-to-learning',
      promptKnown: 'Введите IPA',
      acceptedAnswersKnown: ['həˈləʊ', 'həˈloʊ'],
      answerMode: 'ipa',
    });

    expect(readings).toEqual(['həˈləʊ', 'həˈloʊ']);
  });

  it('should collect ipa from flip card sides', () => {
    const readings = collectCardIpaReadings({
      id: 'flip-ipa-1',
      kind: 'flip',
      title: 'Flip (IPA)',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      front: 'Привет',
      back: 'Hello',
      frontLexeme: { primary: 'Привет', script: 'cyrl' },
      backLexeme: { primary: 'Hello', script: 'latn', ipa: 'həˈləʊ' },
    });

    expect(readings).toContain('həˈləʊ');
  });

  it('should not collect ipa for cloze and code-trace cards without phonetics', () => {
    const clozeReadings = collectCardIpaReadings({
      id: 'cloze-ipa-1',
      kind: 'cloze',
      title: 'Cloze',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      promptKnown: 'I ___ coffee.',
      correctAnswer: 'drink',
    });
    expect(clozeReadings).toEqual([]);

    const traceReadings = collectCardIpaReadings({
      id: 'trace-ipa-1',
      kind: 'code-trace',
      title: 'Trace',
      appearance: { theme: 'azure-blue', fontSize: 'md' },
      code: { language: 'cpp', code: 'int main() {}' },
      outputOptions: ['0'],
      correctIndex: 0,
    });
    expect(traceReadings).toEqual([]);
  });
});
