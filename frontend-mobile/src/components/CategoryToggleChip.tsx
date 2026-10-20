import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface CategoryToggleChipProps {
  label: string;
  color: string;
  activo: boolean;
  onPress?: () => void;
}

export const CategoryToggleChip = ({ label, color, activo, onPress }: CategoryToggleChipProps) => (
  <TouchableOpacity
    style={[styles.chip, activo ? { backgroundColor: color } : styles.chipInactivo]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {!activo && <View style={[styles.dot, { backgroundColor: color }]} />}
    <Text style={[styles.label, activo ? styles.labelActivo : { color: perfilColors.textPrimary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: perfilRadius.pill,
    marginRight: 8,
    marginBottom: 8,
  },
  chipInactivo: {
    backgroundColor: perfilColors.card,
    borderWidth: 1,
    borderColor: perfilColors.divider,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  labelActivo: { color: '#FFFFFF' },
});