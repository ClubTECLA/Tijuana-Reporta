import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoriaUI } from '@/features/categorias/categorias';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

interface ChipCategoriaProps {
  categoria: CategoriaUI;
  activa: boolean;
  onPress: () => void;
}

// Chip de categoría (Figma `Categoría/…`): activo = relleno del color del marcador con punto y
// texto blancos; apagado = blanco con borde y punto del color de la categoría.
export function ChipCategoria({ categoria, activa, onPress }: ChipCategoriaProps) {
  // Etiqueta y color vienen del catálogo del backend.
  const { color, etiqueta } = categoria;
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
