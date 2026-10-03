import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { CategoriaReporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { CategoriaBadge } from './CategoriaBadge';

const SIZE = 44;
const BADGE_SIZE = 15;

interface CategoriaChipProps {
  categoria: CategoriaReporte;
  onQuitar: () => void;
}

// Categoría elegida desde "+ Ver mas" que no está entre las 4 tarjetas
// visibles: se muestra como un círculo pequeño arriba de la grilla, con un
// botón rojo de "quitar" superpuesto (Figma: nodo "IncidentesSeleccionado").
export function CategoriaChip({ categoria, onQuitar }: CategoriaChipProps) {
  return (
    <View style={styles.wrap}>
      <CategoriaBadge categoria={categoria} size={SIZE} />
      <Pressable
        onPress={onQuitar}
        accessibilityRole="button"
        accessibilityLabel="Quitar categoría"
        hitSlop={8}
        style={styles.quitar}
      >
        <Svg width={9} height={9} viewBox="0 0 9 9" fill="none">
          <Path d="M1 1L8 8M8 1L1 8" stroke={colors.white} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
  },
  quitar: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: '#ff383c',
    borderWidth: 1.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
