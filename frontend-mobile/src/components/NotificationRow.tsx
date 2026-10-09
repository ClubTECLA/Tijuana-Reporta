import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Notificacion, TipoNotificacion } from '../types/notificacion';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

const ICONS: Record<TipoNotificacion, string> = {
  alerta: '⚠️',
  info: '🔵',
  exito: '✅',
  aviso: '🌧️',
  comentario: '💬',
};

const ICON_BG: Record<TipoNotificacion, string> = {
  alerta: '#FDE8E8',
  info: perfilColors.primaryTint,
  exito: '#E3F5E9',
  aviso: '#FEF3C7',
  comentario: perfilColors.primaryTint,
};

interface NotificationRowProps {
  notificacion: Notificacion;
  onPress?: () => void;
}

export const NotificationRow = ({ notificacion, onPress }: NotificationRowProps) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: ICON_BG[notificacion.tipo] }]}>
      <Text style={styles.icon}>{ICONS[notificacion.tipo]}</Text>
    </View>
    <View style={styles.texts}>
      <Text style={styles.titulo}>{notificacion.titulo}</Text>
      <Text style={styles.subtitulo} numberOfLines={2}>{notificacion.subtitulo}</Text>
    </View>
    <View style={styles.right}>
      <Text style={styles.tiempo}>{notificacion.tiempo}</Text>
      {!notificacion.leida && <View style={styles.dot} />}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: perfilRadius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 16 },
  texts: { flex: 1 },
  titulo: { fontSize: 14, fontWeight: '600', color: perfilColors.textPrimary },
  subtitulo: { fontSize: 13, color: perfilColors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  tiempo: { fontSize: 11, color: perfilColors.textSecondary },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: perfilColors.primary,
    marginTop: 6,
  },
});
