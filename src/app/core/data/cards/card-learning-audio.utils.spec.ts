import { contentLanguageSpeechLocale, playLearningAudio, resolveLearningSpeech } from './card-learning-audio.utils';

describe('card-learning-audio.utils', () => {
  it('should map content language to speech locale', () => {
    expect(contentLanguageSpeechLocale('zh')).toBe('zh-CN');
    expect(contentLanguageSpeechLocale('en')).toBe('en-US');
    expect(contentLanguageSpeechLocale('ru')).toBe('ru-RU');
  });

  it('should prefer audio url over speech synthesis', () => {
    const play = jasmine.createSpy('play');
    const audioSpy = spyOn(window, 'Audio').and.returnValue({
      play,
    } as unknown as HTMLAudioElement);

    playLearningAudio({
      audioUrl: 'https://example.com/word.mp3',
      text: '你好',
      language: 'zh',
    });

    expect(audioSpy).toHaveBeenCalledWith('https://example.com/word.mp3');
    expect(play).toHaveBeenCalled();
  });

  it('should speak text when audio url is missing', () => {
    const speak = spyOn(speechSynthesis, 'speak');
    spyOn(speechSynthesis, 'cancel');
    spyOn(speechSynthesis, 'getVoices').and.returnValue([]);

    playLearningAudio({
      text: 'Hello',
      language: 'en',
    });

    expect(speak).toHaveBeenCalled();
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
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
