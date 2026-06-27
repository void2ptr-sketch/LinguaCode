import type { ContentLanguage } from '../models';

const SPEECH_LOCALE: Record<ContentLanguage, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

export type PlayLearningAudioOptions = {
  audioUrl?: string | null;
  text?: string | null;
  language: ContentLanguage;
};

export function contentLanguageSpeechLocale(language: ContentLanguage): string {
  return SPEECH_LOCALE[language];
}

/** Аудиофайл карточки или синтез речи текста на изучаемом языке. */
export function playLearningAudio(options: PlayLearningAudioOptions): void {
  const url = options.audioUrl?.trim();
  if (url) {
    const audio = new Audio(url);
    void audio.play();
    return;
  }

  const text = options.text?.trim();
  if (!text || typeof speechSynthesis === 'undefined') {
    return;
  }

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = contentLanguageSpeechLocale(options.language);
  speechSynthesis.speak(utterance);
}
