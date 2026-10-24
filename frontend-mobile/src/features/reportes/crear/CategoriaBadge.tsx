import { StyleSheet, View } from 'react-native';
import { IconoCategoria } from '@/features/categorias/IconoCategoria';
import { markerSpecs } from '@/features/mapa/markers';
import type { CategoriaReporte } from '@/types/api';

// El icono mide la mitad del círculo, como en la web (size-6 en size-12).
const ICONO_SOBRE_CIRCULO = 0.5;

interface CategoriaBadgeProps {
  categoria: CategoriaReporte;
  size: number;
  /** Color del backend (`resolverCategoria`); sin él se usa la paleta local del flujo de crear. */
  color?: string;
  /** Agranda el icono alrededor de su centro (la pantalla de éxito lo dibuja más grande). */
  glyphScale?: number;
}

export function CategoriaBadge({ categoria, size, color, glyphScale = 1 }: CategoriaBadgeProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? markerSpecs[categoria].color },
      ]}
    >
      <IconoCategoria slug={categoria} size={size * ICONO_SOBRE_CIRCULO * glyphScale} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
