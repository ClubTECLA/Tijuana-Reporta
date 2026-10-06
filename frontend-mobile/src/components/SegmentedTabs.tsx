import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface SegmentedTabsProps<T extends string> {
  options: readonly T[];
  selected: T;
  onSelect: (option: T) => void;
}

export const SegmentedTabs = <T extends string>({ options, selected, onSelect }: SegmentedTabsProps<T>) => (
  <View style={styles.container} accessibilityRole="tablist">
    {options.map((option) => {
      const active = option === selected;
      return (
        <TouchableOpacity
          key={option}
          style={[styles.tab, active && styles.tabActive]}
          onPress={() => onSelect(option)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Text style={[styles.text, active && styles.textActive]}>{option}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#E9EDF3',
    borderRadius: perfilRadius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: perfilRadius.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: perfilColors.card,
  },
  text: { fontSize: 13, fontWeight: '600', color: perfilColors.textSecondary },
  textActive: { color: perfilColors.textPrimary },
});
