/**
 * Базовый слог (без тона) → IPA-ядро/начало (Mandarin, simplified).
 *
 * @remarks
 * Покрытие: 6 из ~413 базовых слогов мандарина (~1.5%).
 * Неизвестные слоги конвертация возвращает как `null` — см. `PINYIN_SYLLABLE_IPA_COVERAGE`.
 */
export const PINYIN_SYLLABLE_IPA: Readonly<Record<string, string>> = {
  guo: 'kuɔ',
  hao: 'xaʊ',
  ma: 'ma',
  ni: 'ni',
  xie: 'ɕjɛ',
  zhong: 'ʈʂʊŋ',
};

/**
 * Статус покрытия словаря IPA.
 *
 * @remarks
 * `known` — количество записей в `PINYIN_SYLLABLE_IPA` (вычисляется автоматически);
 * `total` — полный инвентарь базовых слогов мандарина (~413 без учёта тонов).
 */
export const PINYIN_SYLLABLE_IPA_COVERAGE: Readonly<{ known: number; total: number }> = {
  known: Object.keys(PINYIN_SYLLABLE_IPA).length,
  total: 413,
};

/** Число тона пиньинь → контурная маркировка Чао. */
export const CHAO_TONE_CONTOURS: Record<number, string> = {
  1: '˥',
  2: '˧˥',
  3: '˨˩˦',
  4: '˥˩',
  5: '',
};
