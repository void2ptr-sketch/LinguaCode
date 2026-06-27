import {
  contentLanguageSpeechLocale,
  playLearningAudio,
} from './card-learning-audio.utils';

describe('card-learning-audio.utils', () => {
  it('should map content language to speech locale', () => {
    expect(contentLanguageSpeechLocale('zh')).toBe('zh-CN');
    expect(contentLanguageSpeechLocale('en')).toBe('en-US');
    expect(contentLanguageSpeechLocale('ru')).toBe('ru-RU');
  });

  it('should prefer audio url over speech synthesis', () => {
    const play = jasmine.createSpy('play');
    const audioSpy = spyOn(window, 'Audio').and.returnValue({ play } as unknown as HTMLAudioElement);

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

    playLearningAudio({
      text: '你好',
      language: 'zh',
    });

    expect(speak).toHaveBeenCalled();
    const utterance = speak.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('你好');
    expect(utterance.lang).toBe('zh-CN');
  });
});
