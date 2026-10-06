import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PasoSeguimiento } from '../types/seguimiento';
import { perfilColors } from '../theme/perfilTokens';

interface TrackingTimelineProps {
  pasos: PasoSeguimiento[];
}

const CIRCLE_SIZE = 24;

function Marcador({ estado }: { estado: PasoSeguimiento['estado'] }) {
  if (estado === 'completado') {
    return (
      <View style={[styles.circle, styles.circleCompletado]}>
        <Text style={styles.check}>✓</Text>
      </View>
    );
  }
  if (estado === 'activo') {
    return (
      <View style={[styles.circle, styles.circleActivo]}>
        <View style={styles.dotActivo} />
      </View>
    );
  }
  return <View style={[styles.circle, styles.circlePendiente]} />;
}

export const TrackingTimeline = ({ pasos }: TrackingTimelineProps) => (
  <View>
    {pasos.map((paso, index) => {
      const esUltimo = index === pasos.length - 1;
      const lineaActiva = paso.estado !== 'pendiente' && !esUltimo;
      return (
        <View key={paso.id} style={styles.row}>
          <View style={styles.markerColumn}>
            <Marcador estado={paso.estado} />
            {!esUltimo && (
              <View
                style={[
                  styles.line,
                  lineaActiva ? styles.lineActiva : styles.lineInactiva,
                ]}
              />
            )}
          </View>
          <View style={styles.textColumn}>
            <View style={styles.tituloRow}>
              <Text
                style={[
                  styles.titulo,
                  paso.estado === 'pendiente' && styles.tituloPendiente,
                ]}
              >
                {paso.titulo}
              </Text>
              <Text style={styles.hora}>{paso.hora}</Text>
            </View>
            <Text style={styles.subtitulo}>{paso.subtitulo}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  markerColumn: { alignItems: 'center', width: CIRCLE_SIZE + 8 },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompletado: { backgroundColor: '#22C55E' },
  check: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  circleActivo: {
    backgroundColor: perfilColors.primaryTint,
    borderWidth: 2,
    borderColor: perfilColors.primary,
  },
  dotActivo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: perfilColors.primary,
  },
  circlePendiente: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: perfilColors.divider,
  },
  line: { width: 2, flex: 1, minHeight: 28, marginTop: 2 },
  lineActiva: { backgroundColor: '#22C55E' },
  lineInactiva: { backgroundColor: perfilColors.divider },
  textColumn: { flex: 1, paddingBottom: 20 },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between' },
  titulo: { fontSize: 15, fontWeight: '600', color: perfilColors.textPrimary },
  tituloPendiente: { color: perfilColors.textSecondary },
  hora: { fontSize: 12, color: perfilColors.textSecondary },
  subtitulo: { fontSize: 13, color: perfilColors.textSecondary, marginTop: 2 },
});
