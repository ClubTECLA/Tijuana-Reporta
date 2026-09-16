import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { colors, spacing, borderRadius } from '../theme';

interface ReportBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'inundacion', label: 'Inundación' },
  { id: 'deslave', label: 'Deslave' },
  { id: 'arbol', label: 'Árbol/Poste' },
  { id: 'socavon', label: 'Socavón' },
  { id: 'luz', label: 'Falta de Luz' },
  { id: 'drenaje', label: 'Drenaje' },
];

export const ReportBottomSheetTesting = ({ isVisible, onClose }: ReportBottomSheetProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>¿Qué ves?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.categoryItem, selected === cat.id && styles.selectedItem]}
            onPress={() => setSelected(cat.id)}
          >
            <View style={[styles.circle, selected === cat.id && styles.selectedCircle]} />
            <Text style={[styles.categoryLabel, selected === cat.id && styles.selectedLabel]}>
              {cat.label}
            </Text>
            {selected === cat.id && (
              <View style={styles.checkmark}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.locationContainer}>
        <Text style={styles.locationTitle}>Ubicación del Reporte</Text>
        <Text style={styles.locationText}>Blvd. Uabc 224</Text>
      </View>
    </BottomSheet>
  );
};

// Assuming the "Default" version might be a vertical list instead of a horizontal grid
export const ReportBottomSheetDefault = ({ isVisible, onClose }: ReportBottomSheetProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>¿Qué ves?</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.list}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.listItem, selected === cat.id && styles.selectedListItem]}
            onPress={() => setSelected(cat.id)}
          >
            <View style={styles.row}>
              <View style={[styles.circleSmall, selected === cat.id && styles.selectedCircle]} />
              <Text style={[styles.listLabel, selected === cat.id && styles.selectedLabel]}>
                {cat.label}
              </Text>
            </View>
            {selected === cat.id && (
              <Text style={styles.checkTextDark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.locationContainer}>
        <Text style={styles.locationTitle}>Ubicación del Reporte</Text>
        <Text style={styles.locationText}>Blvd. Uabc 224</Text>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  // Testing Version (Grid)
  grid: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 100,
  },
  selectedItem: {
    opacity: 1,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  selectedCircle: {
    backgroundColor: colors.accent,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  selectedLabel: {
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 10,
    backgroundColor: colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkTextDark: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Default Version (List)
  list: {
    paddingVertical: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  selectedListItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  listLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  // Common
  locationContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
  },
  locationTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  }
});
