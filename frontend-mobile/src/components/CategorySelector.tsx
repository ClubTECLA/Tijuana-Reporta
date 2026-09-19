import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import type { CategoriaReporte } from '../types/api';

interface CategorySelectorProps {
  value: CategoriaReporte | null;
  onChange: (cat: CategoriaReporte) => void;
  error?: string;
}

const CATEGORIAS: Record<CategoriaReporte, { emoji: string; label: string }> = {
  socavon:    { emoji: '🕳️',  label: 'Socavón' },
  peligro:    { emoji: '⚠️',  label: 'Peligro' },
  drenaje:    { emoji: '🌧️',  label: 'Drenaje' },
  luz:        { emoji: '💡',  label: 'Luz' },
  deslave:    { emoji: '⛰️',  label: 'Deslave' },
  arbol:      { emoji: '🌳',  label: 'Árbol' },
  inundacion: { emoji: '🌊',  label: 'Inundación' },
  servicios:  { emoji: '🔧',  label: 'Servicios' },
  otro:       { emoji: '📍',  label: 'Otro' },
};

const CATEGORY_KEYS = Object.keys(CATEGORIAS) as CategoriaReporte[];

interface ChipProps {
  cat: CategoriaReporte;
  selected: boolean;
  onPress: () => void;
}

const Chip = ({ cat, selected, onPress }: ChipProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.06 : 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [selected, scale]);

  const { emoji, label } = CATEGORIAS[cat];

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text
          style={[
            styles.chipLabel,
            selected ? styles.chipLabelSelected : styles.chipLabelUnselected,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CategorySelector = ({
  value,
  onChange,
  error,
}: CategorySelectorProps) => {
  const rows: CategoriaReporte[][] = [];
  for (let i = 0; i < CATEGORY_KEYS.length; i += 3) {
    rows.push(CATEGORY_KEYS.slice(i, i + 3));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Categoría</Text>
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cat) => (
              <Chip
                key={cat}
                cat={cat}
                selected={value === cat}
                onPress={() => onChange(cat)}
              />
            ))}
            {/* Fill empty slots in last row so flex layout stays aligned */}
            {row.length < 3 &&
              Array.from({ length: 3 - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={{ flex: 1 }} />
              ))}
          </View>
        ))}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.headingDark,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 24,
  },
  chipLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  chipLabelSelected: {
    color: colors.white,
  },
  chipLabelUnselected: {
    color: colors.headingDark,
  },
  errorText: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.danger,
  },
});
