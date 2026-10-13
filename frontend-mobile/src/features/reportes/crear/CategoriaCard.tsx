import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoriaReporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { markerSpecs } from '@/features/mapa/markers';
import { CategoriaBadge } from './CategoriaBadge';
import { CATEGORIA_LABEL } from './categorias';

interface CategoriaCardProps {
  categoria: CategoriaReporte;
  selected: boolean;
  /** Estado de error: las tarjetas se atenúan dentro del recuadro rojo. */
  dimmed?: boolean;
  /** Tamaño de la lista expandida (≈0.94 de la tarjeta de la hoja). */
  compact?: boolean;
  onPress: () => void;
}

/** Muestra una categoría seleccionable con variantes compacta, seleccionada y atenuada. */
export function CategoriaCard({ categoria, selected, dimmed = false, compact = false, onPress }: CategoriaCardProps) {
  const s = compact ? 0.9375 : 1;
  const label = CATEGORIA_LABEL[categoria];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        styles.card,
        {
          height: 133.13 * s,
          borderRadius: 20.46 * s,
          paddingTop: 17.05 * s,
        },
        // Seleccionada: la tarjeta se rellena con el color propio de la categoría
        // (el mismo que su marcador en el mapa), no un azul genérico — así varias
        // tarjetas elegidas a la vez se distinguen entre sí igual que en el Figma.
        selected && { backgroundColor: markerSpecs[categoria].color, borderColor: markerSpecs[categoria].color },
        dimmed && styles.dimmed,
      ]}
    >
      {/* Seleccionada: el círculo comparte color con la tarjeta, así que se
          separa con la sombra que trae el Figma. */}
      <View style={selected && styles.badgeSombra}>
        <CategoriaBadge categoria={categoria} size={61.35 * s} />
      </View>
      <Text
        style={[
          styles.label,
          { fontSize: 18.75 * s, lineHeight: 23.44 * s, marginTop: 10.2 * s },
          selected && styles.labelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2.03,
    borderColor: colors.borderSubtle,
  },
  dimmed: {
    opacity: 0.5,
  },
  badgeSombra: {
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
    padding: 2,
  },
  label: {
    fontFamily: fontFamily.medium,
    color: colors.ink,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.white,
  },
});
