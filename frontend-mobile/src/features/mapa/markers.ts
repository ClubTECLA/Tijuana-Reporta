import type { ImageSourcePropType } from 'react-native';
import type { CategoriaReporte } from '@/types/api';
import { colors } from '@/theme/colors';

type Glyph =
  | {
      kind: 'raster';
      source: ImageSourcePropType;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { kind: 'vector'; d: string; strokeWidth: number; fill?: string };

export interface MarkerSpec {
  color: string;
  glyph?: Glyph;
}

// Valores de los componentes de marcador del Figma (canvas 96×96, badge de
// r=25 con borde blanco de 2). x/y/width/height del glifo están en ese canvas.
export const markerSpecs: Record<CategoriaReporte, MarkerSpec> = {
  socavon: {
    color: '#EF6C33',
    glyph: {
      kind: 'raster',
      source: require('../../../assets/map/glyphs/socavon.png'),
      x: 38,
      y: 38,
      width: 21,
      height: 21,
    },
  },
  peligro: {
    color: '#FF0000',
    glyph: {
      kind: 'vector',
      d: 'M47.862 45.3371V48.3869M47.862 50.6742V50.6819M47.862 40L54.724 52.1991H41L47.862 40Z',
      strokeWidth: 1.44865,
    },
  },
  drenaje: {
    color: '#0891B2',
    glyph: {
      kind: 'vector',
      d: 'M41 43.6011H54.8728M41 47.9364H54.8728M41 52.2716H54.8728M44.4682 41V54.8728M47.9364 41V54.8728M51.4046 41V54.8728',
      strokeWidth: 1.6474,
    },
  },
  luz: {
    color: '#EFCD33',
    glyph: {
      kind: 'vector',
      d: 'M48.9275 41L43 48.9034H47.6103L46.9517 54.1723L52.8792 46.2689H48.2689L48.9275 41Z',
      strokeWidth: 1.25137,
      fill: 'white',
    },
  },
  deslave: {
    color: '#662D01',
    glyph: {
      kind: 'raster',
      source: require('../../../assets/map/glyphs/deslave.png'),
      x: 40,
      y: 38,
      width: 17,
      height: 17,
    },
  },
  arbol: {
    color: '#2E8B57',
    glyph: {
      kind: 'raster',
      source: require('../../../assets/map/glyphs/arbol.png'),
      x: 35,
      y: 34,
      width: 29,
      height: 24,
    },
  },
  inundacion: {
    color: '#2F6FE0',
    glyph: {
      kind: 'raster',
      source: require('../../../assets/map/glyphs/inundacion.png'),
      x: 35,
      y: 35,
      width: 26,
      height: 26,
    },
  },
  // El Figma no define marcador para estas categorías: badge liso por ahora.
  servicios: { color: colors.primary },
  otro: { color: colors.primary },
};
