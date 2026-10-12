import { vi } from 'vitest';

import {
  contentLanguageSpeechLocale,
  playLearningAudio,
  resolveLearningSpeech,
} from './card-learning-audio.utils';

describe('card-learning-audio.utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should map content language to speech locale', () => {
    expect(contentLanguageSpeechLocale('zh')).toBe('zh-CN');
    expect(contentLanguageSpeechLocale('en')).toBe('en-US');
    expect(contentLanguageSpeechLocale('ru')).toBe('ru-RU');
  });

  it('should prefer audio url over speech synthesis', () => {
    const play = vi.fn().mockName('play');
    const audioSpy = vi
      .spyOn(window, 'Audio')
      .mockImplementation(
        class MockAudio {
          play = play;
        } as unknown as typeof Audio,
      );

    playLearningAudio({
      audioUrl: 'https://example.com/word.mp3',
      text: '你好',
      language: 'zh',
    });

    expect(audioSpy).toHaveBeenCalledWith('https://example.com/word.mp3');
    expect(play).toHaveBeenCalled();
  });

  it('should speak text when audio url is missing', () => {
    const speak = vi.fn().mockName('speak');
    const cancel = vi.fn().mockName('cancel');
    const getVoices = vi.fn().mockName('getVoices').mockReturnValue([]);
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices });

    class MockSpeechSynthesisUtterance {
      lang = '';
      rate = 1;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

    playLearningAudio({
      text: 'Hello',
      language: 'en',
    });

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalled();
    const utterance = speak.mock.lastCall![0] as MockSpeechSynthesisUtterance;
    expect(utterance.text).toBe('Hello');
    expect(utterance.lang).toBe('en-US');
  });

  it('should prefer pinyin for chinese speech text', () => {
    const speech = resolveLearningSpeech(
      { primary: '你好', script: 'hani', pinyin: 'nǐ hǎo' },
      '你好',
      'zh',
    );

    expect(speech.text).toBe('nǐ hǎo');
    expect(speech.locale).toBe('en-US');
  });
});
