import type { ToneMark } from './phonetic-content.types';

/**
 * Available tone color scheme presets for visual tone marking.
 *
 * @remarks
 * `classic` — Nathan Dummit (2008); `pastel` — soft colors; `vivid` — high contrast; `warm` — warm palette.
 */
export type ToneColorSchemeId = 'classic' | 'pastel' | 'vivid' | 'warm';

/**
 * Mapping of tone marks to hex color values.
 *
 * @remarks
 * Keys are tone marks (1–5); values are CSS hex color strings.
 */
export type ToneColorPalette = Record<ToneMark, string>;

/**
 * A tone color scheme with metadata and color mapping.
 *
 * @remarks
 * Used for visual tone marking on Chinese characters and Pinyin.
 */
export type ToneColorScheme = {
  id: ToneColorSchemeId;
  label: string;
  description: string;
  colors: ToneColorPalette;
};

/**
 * Available tone color scheme presets for visual tone marking.
 *
 * @remarks
 * Each scheme maps Mandarin tone marks (1–5) to distinct CSS colors.
 * Schemes: `classic` (Nathan Dummit, 2008), `pastel` (soft), `vivid` (high contrast), `warm` (warm palette).
 */
export const TONE_COLOR_SCHEMES: readonly ToneColorScheme[] = [
  {
    id: 'classic',
    label: 'Классическая',
    description:
      'Стандарт Nathan Dummit (2008): 1-й красный · 2-й оранжевый · 3-й зелёный · 4-й синий · нейтральный чёрный',
    colors: {
      1: '#ff0000',
      2: '#ffa500',
      3: '#008000',
      4: '#0000ff',
      5: '#000000',
    },
  },
  {
    id: 'pastel',
    label: 'Пастельная',
    description: 'Мягкие оттенки для длительного чтения',
    colors: {
      1: '#ef5350',
      2: '#66bb6a',
      3: '#42a5f5',
      4: '#424242',
      5: '#9e9e9e',
    },
  },
  {
    id: 'vivid',
    label: 'Яркая',
    description: 'Насыщенные цвета, высокий контраст',
    colors: {
      1: '#d50000',
      2: '#00c853',
      3: '#2962ff',
      4: '#000000',
      5: '#616161',
    },
  },
  {
    id: 'warm',
    label: 'Тёплая',
    description: 'Красный · оранжевый · бирюза · коричневый · серый',
    colors: {
      1: '#bf360c',
      2: '#ef6c00',
      3: '#00897b',
      4: '#4e342e',
      5: '#78909c',
    },
  },
] as const;

/** Default tone color scheme ID applied when no user preference exists. */
export const DEFAULT_TONE_COLOR_SCHEME_ID: ToneColorSchemeId = 'classic';

/**
 * Array of all available tone color scheme IDs.
 *
 * @remarks
 * Derived from `TONE_COLOR_SCHEMES` for use in dropdown selectors and validation.
 */
export const TONE_COLOR_SCHEME_IDS: readonly ToneColorSchemeId[] = TONE_COLOR_SCHEMES.map(
  (scheme) => scheme.id,
);
