import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EstadoReporte, estadoStyles, perfilRadius } from '../theme/perfilTokens';

export const StatusBadge = ({ estado }: { estado: EstadoReporte }) => {
  const s = estadoStyles[estado];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: perfilRadius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: '600' },
});
