import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { PasoSeguimiento } from '../types/seguimiento';
import { EstadoReporte, perfilColors, perfilRadius } from '../theme/perfilTokens';

// Datos de ejemplo: todavía no existe el endpoint de detalle de reporte en el contrato OpenAPI.
const MOCK_REPORTE = {
  codigo: 'REP-8814',
  titulo: 'Inundación en 3ra y Constitución',
  descripcion: 'Está subiendo el agua en la 3ra, ya no pasan carros.',
  estado: 'agrupado' as EstadoReporte,
  enviadoMeta: 'Enviado hoy 14:21',
};

const MOCK_PASOS: PasoSeguimiento[] = [
  { id: '1', titulo: 'Reporte enviado', subtitulo: 'Con foto y ubicación', hora: '14:21', estado: 'completado' },
  { id: '2', titulo: 'Agrupado con reportes cercanos', subtitulo: 'Se unió a INC-2471 (a 120 m)', hora: '14:35', estado: 'completado' },
  { id: '3', titulo: 'En revisión por el equipo', subtitulo: 'Falta 1 confirmación para verificar', hora: 'ahora', estado: 'activo' },
  { id: '4', titulo: 'Resuelto', subtitulo: 'Te avisaremos cuando termine', hora: '–', estado: 'pendiente' },
];

const TOP_INSET = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 54;

interface DetalleReporteScreenProps {
  onBack?: () => void;
  onShare?: () => void;
  onEliminar?: () => void;
}

export const DetalleReporteScreen = ({ onBack, onShare, onEliminar }: DetalleReporteScreenProps) => {
  const r = MOCK_REPORTE;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{r.codigo}</Text>
        <TouchableOpacity
          onPress={onShare}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Compartir"
        >
          <Text style={styles.shareIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Placeholder de foto: todavía no hay imágenes reales conectadas */}
        <View style={styles.photo} />

        <View style={styles.metaRow}>
          <StatusBadge estado={r.estado} />
          <Text style={styles.enviadoMeta}>{r.enviadoMeta}</Text>
        </View>

        <Text style={styles.tituloReporte}>{r.titulo}</Text>
        <Text style={styles.cita}>«{r.descripcion}»</Text>

        <Text style={styles.section}>Seguimiento</Text>
        <Card style={styles.timelineCard}>
          <TrackingTimeline pasos={MOCK_PASOS} />
        </Card>

        <TouchableOpacity style={styles.compartirBtn} onPress={onShare}>
          <Text style={styles.compartirText}>📤  Compartir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.eliminarBtn} onPress={onEliminar}>
          <Text style={styles.eliminarText}>🗑  Eliminar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_INSET + 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: perfilColors.divider,
  },
  backIcon: { fontSize: 28, lineHeight: 30, color: perfilColors.textPrimary },
  shareIcon: { fontSize: 16 },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: perfilColors.textPrimary,
  },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  photo: {
    height: 180,
    borderRadius: perfilRadius.card,
    backgroundColor: '#D1D5DB',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  enviadoMeta: { fontSize: 12, color: perfilColors.textSecondary, marginLeft: 8 },
  tituloReporte: { fontSize: 18, fontWeight: '700', color: perfilColors.textPrimary, marginBottom: 4 },
  cita: { fontSize: 14, color: perfilColors.textSecondary, fontStyle: 'italic' },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: perfilColors.sectionLabel,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  timelineCard: { paddingTop: 12 },
  compartirBtn: {
    marginTop: 20,
    backgroundColor: perfilColors.card,
    borderRadius: perfilRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: perfilColors.divider,
  },
  compartirText: { fontSize: 15, fontWeight: '600', color: perfilColors.textPrimary },
  eliminarBtn: {
    marginTop: 10,
    backgroundColor: perfilColors.dangerTint,
    borderRadius: perfilRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  eliminarText: { fontSize: 15, fontWeight: '600', color: perfilColors.danger },
});
