import React from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ReportCard } from '../components/ReportCard';
import { EstadoVista } from '../components/estado/EstadoVista';
import { Reporte } from '../types/reporte';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

interface MisReportesScreenProps {
  activos: Reporte[];
  cerrados: Reporte[];
  cargando?: boolean;
  sinConexion?: boolean;
  error?: boolean;
  onReintentar?: () => void;
  onBack?: () => void;
  onSelectReporte?: (reporte: Reporte) => void;
}

export const MisReportesScreen = ({
  activos,
  cerrados,
  cargando,
  sinConexion,
  error,
  onReintentar,
  onBack,
  onSelectReporte,
}: MisReportesScreenProps) => (
  <View style={styles.screen}>
    <ScreenHeader title="Mis reportes" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      {cargando ? (
        <ActivityIndicator color={perfilColors.primary} style={styles.cargando} />
      ) : sinConexion ? (
        <EstadoVista estado="sin-conexion" mensaje="Sin conexión: tus reportes se cargarán al reconectar." />
      ) : error ? (
        <EstadoVista estado="error" mensaje="No se pudieron cargar tus reportes." onReintentar={onReintentar} />
      ) : (
        <>
          <View style={styles.historialPill}>
            <Text style={styles.historialText}>Historial · {activos.length + cerrados.length}</Text>
          </View>

          {activos.length === 0 && cerrados.length === 0 ? (
            <EstadoVista
              estado="vacio"
              titulo="Aún no has reportado nada"
              mensaje="Cuando reportes un incidente desde el mapa, aquí podrás seguir su estado."
            />
          ) : (
            <>
              <Text style={styles.section}>Activos</Text>
              {activos.length === 0 ? (
                <EstadoVista estado="vacio" mensaje="No tienes reportes activos." compacto />
              ) : (
                activos.map((r) => <ReportCard key={r.id} reporte={r} onPress={() => onSelectReporte?.(r)} />)
              )}

              <Text style={styles.section}>Cerrados</Text>
              {cerrados.length === 0 ? (
                <EstadoVista estado="vacio" mensaje="Ningún reporte cerrado todavía." compacto />
              ) : (
                cerrados.map((r) => <ReportCard key={r.id} reporte={r} onPress={() => onSelectReporte?.(r)} />)
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  cargando: { marginVertical: 40 },
  historialPill: {
    backgroundColor: perfilColors.card,
    borderRadius: perfilRadius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  historialText: { fontSize: 14, fontWeight: '600', color: perfilColors.textSecondary },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: perfilColors.sectionLabel,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
});