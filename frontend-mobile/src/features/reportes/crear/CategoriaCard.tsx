import { Pressable, StyleSheet, Text } from 'react-native';
import type { CategoriaReporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
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
        selected && styles.selected,
        dimmed && styles.dimmed,
      ]}
    >
      <CategoriaBadge categoria={categoria} size={61.35 * s} />
      <Text style={[styles.label, { fontSize: 18.75 * s, lineHeight: 23.44 * s, marginTop: 10.2 * s }]}>
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
  selected: {
    borderColor: colors.primary,
    backgroundColor: '#f2f7ff',
  },
  dimmed: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fontFamily.medium,
    color: colors.ink,
    textAlign: 'center',
  },
});
