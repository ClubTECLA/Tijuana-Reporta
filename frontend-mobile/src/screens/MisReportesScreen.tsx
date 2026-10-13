import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { ReportCard } from '../components/ReportCard';
import { EstadoVista } from '../components/estado/EstadoVista';
import { Reporte } from '../types/reporte';
import { perfilColors, perfilRadius } from '../theme/perfilTokens';

// igual aqui son ejemoplos
const MOCK_ACTIVOS: Reporte[] = [
  { id: '1', codigo: 'REP-8814', titulo: 'Inundación en 3ra y Constitución', estado: 'en_revision', meta: 'se unió a INC-2471' },
  { id: '2', codigo: 'REP-8833', titulo: 'Árbol caído en Blvd. Agua Caliente', estado: 'en_revision', meta: 'hoy 14:33' },
  { id: '3', codigo: 'REP-8835', titulo: 'Socavón en Col. Libertad', estado: 'pendiente', meta: 'enviando...' },
];

const MOCK_CERRADOS: Reporte[] = [
  { id: '4', codigo: 'REP-8702', titulo: 'Drenaje tapado en Col. Obrera', estado: 'resuelto', meta: '28 ago' },
  { id: '5', codigo: 'REP-8690', titulo: 'Luz intermitente en Otay', estado: 'descartado', meta: 'duplicado de INC-2464' },
];

const TOTAL_HISTORIAL = 10;

interface MisReportesScreenProps {
  onBack?: () => void;
  onSelectReporte?: (reporte: Reporte) => void;
}

export const MisReportesScreen = ({ onBack, onSelectReporte }: MisReportesScreenProps) => (
  <View style={styles.screen}>
    <ScreenHeader title="Mis reportes" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.historialPill}>
        <Text style={styles.historialText}>Historial · {TOTAL_HISTORIAL}</Text>
      </View>

      {MOCK_ACTIVOS.length === 0 && MOCK_CERRADOS.length === 0 ? (
        <EstadoVista
          estado="vacio"
          titulo="Aún no has reportado nada"
          mensaje="Cuando reportes un incidente desde el mapa, aquí podrás seguir su estado."
        />
      ) : (
        <>
          <Text style={styles.section}>Activos</Text>
          {MOCK_ACTIVOS.length === 0 ? (
            <EstadoVista estado="vacio" mensaje="No tienes reportes activos." compacto />
          ) : (
            MOCK_ACTIVOS.map((r) => <ReportCard key={r.id} reporte={r} onPress={() => onSelectReporte?.(r)} />)
          )}

          <Text style={styles.section}>Cerrados</Text>
          {MOCK_CERRADOS.length === 0 ? (
            <EstadoVista estado="vacio" mensaje="Ningún reporte cerrado todavía." compacto />
          ) : (
            MOCK_CERRADOS.map((r) => <ReportCard key={r.id} reporte={r} onPress={() => onSelectReporte?.(r)} />)
          )}
        </>
      )}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
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
