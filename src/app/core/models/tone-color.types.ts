import type { ToneMark } from './phonetic-content.types';

export type ToneColorSchemeId = 'classic' | 'pastel' | 'vivid' | 'warm';

export type ToneColorPalette = Record<ToneMark, string>;

export type ToneColorScheme = {
  id: ToneColorSchemeId;
  label: string;
  description: string;
  colors: ToneColorPalette;
};

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

export const DEFAULT_TONE_COLOR_SCHEME_ID: ToneColorSchemeId = 'classic';

export const TONE_COLOR_SCHEME_IDS: readonly ToneColorSchemeId[] = TONE_COLOR_SCHEMES.map(
  (scheme) => scheme.id,
);
