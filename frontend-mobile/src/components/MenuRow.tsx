import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface MenuRowProps {
  icon: string; // temporal: emoji/texto. Cambiar por icono real cuando el equipo defina la librería.
  title: string;
  subtitle?: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
}

export const MenuRow = ({ icon, title, subtitle, value, danger, onPress }: MenuRowProps) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: danger ? perfilColors.dangerTint : perfilColors.primaryTint }]}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <View style={styles.texts}>
      <Text style={[styles.title, danger && { color: perfilColors.danger }]}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {value ? <Text style={styles.value}>{value}</Text> : null}
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: perfilRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  texts: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '600', color: perfilColors.textPrimary },
  subtitle: { fontSize: 13, color: perfilColors.textSecondary, marginTop: 2 },
  value: { fontSize: 15, fontWeight: '700', color: perfilColors.primary, marginRight: 8 },
  chevron: { fontSize: 24, color: perfilColors.chevron },
});
