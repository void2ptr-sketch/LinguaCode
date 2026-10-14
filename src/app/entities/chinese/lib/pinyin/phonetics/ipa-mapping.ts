/** Base syllable (tone-stripped) → IPA nucleus/onset (Mandarin, simplified). */
export const PINYIN_SYLLABLE_IPA: Readonly<Record<string, string>> = {
  guo: 'kuɔ',
  hao: 'xaʊ',
  ma: 'ma',
  ni: 'ni',
  xie: 'ɕjɛ',
  zhong: 'ʈʂʊŋ',
};

/** Число тона пиньинь → контурная маркировка Чао. */
const CHAO_TONE_CONTOURS: Record<number, string> = {
  1: '˥',
  2: '˧˥',
  3: '˨˩˦',
  4: '˥˩',
  5: '',
};

/**
 * Преобразует слог пиньинь (с тоном) в IPA.
 * Используется внутренне phonetics/ipa-conversion.ts.
 */
export function convertPinyinToIpa(syllable: string, parsePinyinSyllable: (raw: string) => { base: string; tone: number }): string {
  const { base, tone } = parsePinyinSyllable(syllable);
  if (!base) {
    return '';
  }

  const ipaBase = PINYIN_SYLLABLE_IPA[base] ?? base;
  return `${ipaBase}${CHAO_TONE_CONTOURS[tone]}`;
}
