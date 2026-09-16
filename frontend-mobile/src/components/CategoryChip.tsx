import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

interface CategoryChipProps {
  label: string;
  count?: number;
  isSelected?: boolean;
  onPress?: () => void;
}

export const CategoryChip = ({ label, count, isSelected, onPress }: CategoryChipProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, isSelected && styles.selectedCount]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
  },
  selectedContainer: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  selectedLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  count: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: '#ffffff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectedCount: {
    color: colors.accent,
  }
});
