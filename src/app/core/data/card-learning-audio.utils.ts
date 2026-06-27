import type { ContentLanguage } from '../models';
import type { PhoneticLexeme } from '../models/phonetic-content.types';

const SPEECH_LOCALE: Record<ContentLanguage, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  ru: 'ru-RU',
};

export type PlayLearningAudioOptions = {
  audioUrl?: string | null;
  text?: string | null;
  language: ContentLanguage;
  speechLocale?: string;
};

export type LearningSpeech = {
  text: string;
  locale: string;
};

export function contentLanguageSpeechLocale(language: ContentLanguage): string {
  return SPEECH_LOCALE[language];
}

/** Текст и locale для синтеза речи по лексеме карточки. */
export function resolveLearningSpeech(
  lexeme: PhoneticLexeme | undefined,
  fallbackText: string,
  language: ContentLanguage,
): LearningSpeech {
  const fallback = fallbackText.trim();
  const primary = lexeme?.primary.trim() ?? '';

  if (language === 'zh') {
    const pinyin = lexeme?.pinyin?.trim();
    if (pinyin) {
      return { text: pinyin, locale: 'en-US' };
    }

    if (primary) {
      return { text: primary, locale: contentLanguageSpeechLocale('zh') };
    }

    return { text: fallback, locale: contentLanguageSpeechLocale('zh') };
  }

  return {
    text: primary || fallback,
    locale: contentLanguageSpeechLocale(language),
  };
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

  const locale = options.speechLocale ?? contentLanguageSpeechLocale(options.language);
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = locale.startsWith('en') && options.language === 'zh' ? 0.85 : 1;

  const voices = speechSynthesis.getVoices();
  const voice =
    voices.find((item) => item.lang === locale) ??
    voices.find((item) => item.lang.startsWith(locale.slice(0, 2)));
  if (voice) {
    utterance.voice = voice;
  }

  speechSynthesis.speak(utterance);
}
