import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Card } from '../components/Card';
import { Feather } from '@expo/vector-icons';
import { StatusBadge } from '../components/StatusBadge';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { EstadoVista } from '../components/estado/EstadoVista';
import { PasoSeguimiento } from '../types/seguimiento';
import { EstadoReporte, perfilColors, perfilRadius } from '../theme/perfilTokens';

const TOP_INSET = Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 54;

/** Lo que la pantalla pinta de un reporte, ya traducido desde el backend. */
export interface DetalleVista {
  titulo: string;
  direccion?: string;
  estado: EstadoReporte;
  enviado: string;
  confirmaciones: number;
  fotoUrl?: string;
  pasos: PasoSeguimiento[];
}

interface DetalleReporteScreenProps {
  reporte?: DetalleVista;
  cargando?: boolean;
  sinConexion?: boolean;
  error?: boolean;
  noEncontrado?: boolean;
  onReintentar?: () => void;
  onBack?: () => void;
  onShare?: () => void;
}

export const DetalleReporteScreen = ({
  reporte: r,
  cargando,
  sinConexion,
  error,
  noEncontrado,
  onReintentar,
  onBack,
  onShare,
}: DetalleReporteScreenProps) => (
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
      <Text style={styles.title} numberOfLines={1}>Mi reporte</Text>
      {r ? (
        <TouchableOpacity
          onPress={onShare}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Compartir"
        >
          <Feather name="share-2" size={16} color={perfilColors.textPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>

    <ScrollView contentContainerStyle={styles.content}>
      {cargando ? (
        <ActivityIndicator color={perfilColors.primary} style={styles.cargando} />
      ) : sinConexion ? (
        <EstadoVista estado="sin-conexion" mensaje="Sin conexión: el reporte se cargará al reconectar." />
      ) : noEncontrado ? (
        <EstadoVista estado="vacio" titulo="Reporte no encontrado" mensaje="Puede que ya no esté disponible." />
      ) : error || !r ? (
        <EstadoVista estado="error" mensaje="No se pudo cargar el reporte." onReintentar={onReintentar} />
      ) : (
        <>
          {r.fotoUrl ? (
            <Image source={{ uri: r.fotoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.photo} />
          )}

          <View style={styles.metaRow}>
            <StatusBadge estado={r.estado} />
            <Text style={styles.enviadoMeta}>{r.enviado}</Text>
          </View>

          <Text style={styles.tituloReporte}>{r.titulo}</Text>
          {r.direccion ? <Text style={styles.direccion}>{r.direccion}</Text> : null}
          <Text style={styles.confirmaciones}>
            {r.confirmaciones === 1 ? '1 confirmación' : `${r.confirmaciones} confirmaciones`}
          </Text>

          <Text style={styles.section}>Seguimiento</Text>
          <Card style={styles.timelineCard}>
            <TrackingTimeline pasos={r.pasos} />
          </Card>

          <TouchableOpacity style={styles.compartirBtn} onPress={onShare}>
            <View style={styles.btnRow}>
              <Feather name="share-2" size={16} color={perfilColors.textPrimary} />
              <Text style={styles.compartirText}>  Compartir</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  </View>
);

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
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: perfilColors.textPrimary,
  },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  cargando: { marginVertical: 40 },
  photo: {
    height: 180,
    borderRadius: perfilRadius.card,
    backgroundColor: '#D1D5DB',
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  enviadoMeta: { fontSize: 12, color: perfilColors.textSecondary, marginLeft: 8 },
  tituloReporte: { fontSize: 18, fontWeight: '700', color: perfilColors.textPrimary, marginBottom: 4 },
  direccion: { fontSize: 14, color: perfilColors.textSecondary },
  confirmaciones: { fontSize: 13, color: perfilColors.textSecondary, marginTop: 4 },
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
});