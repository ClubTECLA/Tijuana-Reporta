import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoriaReporte } from '@/types/api';
import { markerSpecs } from '@/features/mapa/markers';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { etiquetaLabel } from './categorias';

interface EtiquetaChipProps {
  etiqueta: string;
  /** Categoría a la que pertenece: pone el color del punto y del chip activo. */
  categoria: CategoriaReporte;
  activa: boolean;
  onPress: () => void;
}

/**
 * Chip de "Información adicional" (Figma 16/17): pastilla blanca con un punto del color de su
 * categoría. Activa, toma un tinte de ese mismo color.
 */
export function EtiquetaChip({ etiqueta, categoria, activa, onPress }: EtiquetaChipProps) {
  const color = markerSpecs[categoria].color;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      // Sin `elevation` al estar activo: en Android la sombra se transparenta bajo el tinte y lo ensucia.
      style={[styles.chip, activa && { borderColor: color, backgroundColor: `${color}1f`, elevation: 0 }]}
    >
      <View style={[styles.punto, { backgroundColor: color }]} />
      <Text style={styles.texto} numberOfLines={1}>
        {etiquetaLabel(etiqueta)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
    elevation: 1,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  texto: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
