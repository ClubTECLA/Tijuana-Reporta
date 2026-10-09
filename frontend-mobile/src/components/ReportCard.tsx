import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reporte } from '../types/reporte';
import { StatusBadge } from './StatusBadge';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface ReportCardProps {
  reporte: Reporte;
  onPress?: () => void;
}

export const ReportCard = ({ reporte, onPress }: ReportCardProps) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.thumb, { backgroundColor: reporte.imagenColor ?? '#D1D5DB' }]} />
    <View style={styles.info}>
      <StatusBadge estado={reporte.estado} />
      <Text style={styles.titulo} numberOfLines={2}>{reporte.titulo}</Text>
      <Text style={styles.meta}>{reporte.codigo} · {reporte.meta}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: perfilColors.card,
    borderRadius: perfilRadius.card,
    padding: 10,
    marginBottom: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  info: { flex: 1 },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
    color: perfilColors.textPrimary,
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: perfilColors.textSecondary,
    marginTop: 2,
  },
  chevron: { fontSize: 22, color: perfilColors.chevron, marginLeft: 4 },
});
