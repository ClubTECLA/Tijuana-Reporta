import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { IconoCategoriaEnCanvas } from '@/features/categorias/IconoCategoria';
import { resolverCategoria, type CategoriaUI } from '@/features/categorias/categorias';
import type { CategoriaReporte } from '@/types/api';

const CANVAS = 96;
// Badge de r=25 en el canvas; el icono mide la mitad del badge, como en la web (size-6 en size-12).
const ICONO = 26;
const ICONO_POS = (CANVAS - ICONO) / 2;

interface MapMarkerProps {
  categoria: CategoriaReporte;
  /** Catálogo (`useCategorias`): de ahí salen el color y el icono. */
  catalogo: readonly CategoriaUI[];
  /** Variante con halo pleno y anillo (Variant2 del componente en Figma). */
  halo?: boolean;
  size?: number;
}

export function MapMarker({ categoria, catalogo, halo = false, size = CANVAS }: MapMarkerProps) {
  const { color, icono } = resolverCategoria(categoria, catalogo);

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
        <IconoCategoriaEnCanvas slug={icono} size={ICONO} x={ICONO_POS} y={ICONO_POS} />
      </Svg>
    </View>
  );
}
