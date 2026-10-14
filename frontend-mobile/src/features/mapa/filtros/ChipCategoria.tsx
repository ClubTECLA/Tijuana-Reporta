import { Pressable, StyleSheet, Text, View } from 'react-native';
import { markerSpecs } from '@/features/mapa/markers';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import type { CategoriaFiltro } from './types';

/** Etiqueta en español de cada categoría del picker. */
export const ETIQUETA_CATEGORIA: Record<CategoriaFiltro, string> = {
  inundacion: 'Inundación',
  deslave: 'Deslave',
  drenaje: 'Drenaje',
  arbol: 'Árbol',
  socavon: 'Socavón',
  luz: 'Luz',
};

interface ChipCategoriaProps {
  categoria: CategoriaFiltro;
  activa: boolean;
  onPress: () => void;
}

// Chip de categoría (Figma `Categoría/…`): activo = relleno del color del marcador con punto y
// texto blancos; apagado = blanco con borde y punto del color de la categoría.
export function ChipCategoria({ categoria, activa, onPress }: ChipCategoriaProps) {
  const color = markerSpecs[categoria].color;
  const etiqueta = ETIQUETA_CATEGORIA[categoria];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={etiqueta}
      accessibilityState={{ checked: activa }}
      style={({ pressed }) => [
        styles.chip,
        activa ? { backgroundColor: color, borderColor: color } : styles.chipApagado,
        pressed && styles.presionado,
      ]}
    >
      <View style={[styles.punto, { backgroundColor: activa ? colors.white : color }]} />
      <Text style={[styles.texto, activa && styles.textoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 1.5,
    shadowOffset: { width: 0, height: 1 },
  },
  chipApagado: {
    backgroundColor: colors.white,
    borderColor: colors.divider,
  },
  presionado: {
    opacity: 0.85,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  texto: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textoActivo: {
    color: colors.white,
  },
});
