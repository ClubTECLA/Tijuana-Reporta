import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { CategoriaReporte } from '@/types/api';
import { markerSpecs } from '@/features/mapa/markers';

// Posición/tamaño de cada glifo como fracción del diámetro del círculo, tomada
// de las tarjetas de categoría del Figma (círculo de 61.35 px).
type GlyphSpec =
  | { kind: 'raster'; source: ImageSourcePropType; x: number; y: number; w: number; h: number }
  | {
      kind: 'vector';
      viewBox: [number, number];
      d: string;
      strokeWidth: number;
      x: number;
      y: number;
      w: number;
      h: number;
    };

const glyphs: Partial<Record<CategoriaReporte, GlyphSpec>> = {
  inundacion: {
    kind: 'raster',
    source: require('../../../../assets/map/glyphs/inundacion.png'),
    x: 0.1579,
    y: 0.1622,
    w: 0.6835,
    h: 0.6835,
  },
  deslave: {
    kind: 'raster',
    source: require('../../../../assets/map/glyphs/deslave.png'),
    x: 0.2914,
    y: 0.2681,
    w: 0.4475,
    h: 0.4475,
  },
  arbol: {
    kind: 'raster',
    source: require('../../../../assets/map/glyphs/arbol.png'),
    x: 0.1579,
    y: 0.1622,
    w: 0.7623,
    h: 0.6309,
  },
  socavon: {
    kind: 'raster',
    source: require('../../../../assets/map/glyphs/socavon.png'),
    x: 0.2106,
    y: 0.2147,
    w: 0.552,
    h: 0.552,
  },
  luz: {
    kind: 'vector',
    viewBox: [22.4406, 29.08],
    d: 'M13.212 1.26155L1.26146 17.1957H10.5564L9.22852 27.8184L21.1791 11.8843H11.8842L13.212 1.26155Z',
    strokeWidth: 2.5229,
    x: 0.3226,
    y: 0.263,
    w: 0.399,
    h: 0.521,
  },
  drenaje: {
    kind: 'vector',
    viewBox: [23.7684, 23.7684],
    d: 'M1.26145 5.24498H22.5069M1.26145 11.8842H22.5069M1.26145 18.5234H22.5069M6.57283 1.26155V22.5069M11.8842 1.26145V22.5069M17.1956 1.26145V22.5069',
    strokeWidth: 2.5229,
    x: 0.3225,
    y: 0.311,
    w: 0.414,
    h: 0.414,
  },
};

interface CategoriaBadgeProps {
  categoria: CategoriaReporte;
  size: number;
  /** Agranda el glifo alrededor de su centro (la pantalla de éxito lo dibuja más grande). */
  glyphScale?: number;
}

export function CategoriaBadge({ categoria, size, glyphScale = 1 }: CategoriaBadgeProps) {
  const glyph = glyphs[categoria];
  const box = glyph && {
    left: (glyph.x + glyph.w / 2 - (glyph.w * glyphScale) / 2) * size,
    top: (glyph.y + glyph.h / 2 - (glyph.h * glyphScale) / 2) * size,
    width: glyph.w * glyphScale * size,
    height: glyph.h * glyphScale * size,
  };

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: markerSpecs[categoria].color },
      ]}
    >
      {glyph?.kind === 'raster' && box && (
        <Image source={glyph.source} resizeMode="stretch" style={[styles.glyph, box]} />
      )}
      {glyph?.kind === 'vector' && box && (
        <Svg
          style={[styles.glyph, box]}
          viewBox={`0 0 ${glyph.viewBox[0]} ${glyph.viewBox[1]}`}
          fill="none"
        >
          <Path
            d={glyph.d}
            stroke="white"
            strokeWidth={glyph.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
  },
  glyph: {
    position: 'absolute',
  },
});
