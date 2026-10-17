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
    const audioSpy = vi.spyOn(window, 'Audio').mockImplementation(
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

  it('should skip speech synthesis when no text', () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn() });

    playLearningAudio({
      text: '',
      language: 'en',
    });

    expect(speak).not.toHaveBeenCalled();
  });

  it('should skip speech synthesis when speechSynthesis is undefined', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('speechSynthesis', undefined);

    playLearningAudio({
      text: 'Hello',
      language: 'en',
    });
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

  it('should fall back to primary when pinyin is missing for chinese', () => {
    const speech = resolveLearningSpeech(
      { primary: '你好', script: 'hani', pinyin: '' },
      'fallback',
      'zh',
    );

    expect(speech.text).toBe('你好');
    expect(speech.locale).toBe('zh-CN');
  });

  it('should fall back to fallback text when primary is missing for chinese', () => {
    const speech = resolveLearningSpeech(
      { primary: '', script: 'hani', pinyin: '' },
      'fallback text',
      'zh',
    );

    expect(speech.text).toBe('fallback text');
    expect(speech.locale).toBe('zh-CN');
  });

  it('should use primary for non-chinese language', () => {
    const speech = resolveLearningSpeech({ primary: 'Hello', script: 'latn' }, 'fallback', 'en');

    expect(speech.text).toBe('Hello');
    expect(speech.locale).toBe('en-US');
  });

  it('should use fallback when primary is empty for non-chinese', () => {
    const speech = resolveLearningSpeech({ primary: '', script: 'latn' }, 'fallback text', 'en');

    expect(speech.text).toBe('fallback text');
    expect(speech.locale).toBe('en-US');
  });

  it('should use fallback when lexeme is undefined', () => {
    const speech = resolveLearningSpeech(undefined, 'fallback text', 'en');

    expect(speech.text).toBe('fallback text');
    expect(speech.locale).toBe('en-US');
  });

  it('should find voice by full locale match', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const mockVoice = { lang: 'en-US' };
    const getVoices = vi.fn().mockReturnValue([mockVoice]);
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices });

    class MockSpeechSynthesisUtterance {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

    playLearningAudio({
      text: 'Hello',
      language: 'en',
    });

    const utterance = speak.mock.lastCall![0] as { voice: unknown };
    expect(utterance.voice).toBe(mockVoice);
  });

  it('should find voice by language prefix fallback', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const mockVoice = { lang: 'en-GB' };
    const getVoices = vi.fn().mockReturnValue([mockVoice]);
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices });

    class MockSpeechSynthesisUtterance {
      lang = '';
      rate = 1;
      voice: unknown = null;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

    playLearningAudio({
      text: 'Hello',
      language: 'en',
    });

    const utterance = speak.mock.lastCall![0] as { voice: unknown };
    expect(utterance.voice).toBe(mockVoice);
  });

  it('should set slower rate for chinese speech when locale is english', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const getVoices = vi.fn().mockReturnValue([]);
    vi.stubGlobal('speechSynthesis', { speak, cancel, getVoices });

    class MockSpeechSynthesisUtterance {
      lang = '';
      rate = 1;
      constructor(readonly text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

    playLearningAudio({
      text: 'nǐ hǎo',
      language: 'zh',
      speechLocale: 'en-US',
    });

    const utterance = speak.mock.lastCall![0] as MockSpeechSynthesisUtterance;
    expect(utterance.rate).toBe(0.85);
  });

  it('should use default rate for non-chinese speech', () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const getVoices = vi.fn().mockReturnValue([]);
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

    const utterance = speak.mock.lastCall![0] as MockSpeechSynthesisUtterance;
    expect(utterance.rate).toBe(1);
  });
});
