import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { resolverCategoria, type CategoriaUI } from '@/features/categorias/categorias';
import type { CategoriaReporte } from '@/types/api';
import { markerSpecs } from './markers';

const CANVAS = 96;

interface MapMarkerProps {
  categoria: CategoriaReporte;
  /** Catálogo (`useCategorias`): de ahí sale el color; el glifo es local y, sin él, el badge va liso. */
  catalogo: readonly CategoriaUI[];
  /** Variante con halo pleno y anillo (Variant2 del componente en Figma). */
  halo?: boolean;
  size?: number;
}

export function MapMarker({ categoria, catalogo, halo = false, size = CANVAS }: MapMarkerProps) {
  const { color, icono } = resolverCategoria(categoria, catalogo);
  const glyph = icono === 'generico' ? undefined : markerSpecs[icono].glyph;
  const scale = size / CANVAS;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        <Defs>
          <RadialGradient id="halo" cx={48} cy={48} r={48} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor={color} />
            <Stop offset={1} stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={48} cy={48} r={48} fill="url(#halo)" fillOpacity={halo ? 1 : 0.1} />
        {halo && <Circle cx={48} cy={48} r={48} fill="none" stroke={color} strokeWidth={0.3} />}
        <Circle cx={48} cy={48} r={25} fill={color} stroke="white" strokeWidth={2} />
        {glyph?.kind === 'vector' && (
          <Path
            d={glyph.d}
            fill={glyph.fill ?? 'none'}
            stroke="white"
            strokeWidth={glyph.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
      {glyph?.kind === 'raster' && (
        <Image
          source={glyph.source}
          resizeMode="stretch"
          style={[
            styles.glyph,
            {
              left: glyph.x * scale,
              top: glyph.y * scale,
              width: glyph.width * scale,
              height: glyph.height * scale,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    position: 'absolute',
  },
});
