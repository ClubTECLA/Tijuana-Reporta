import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { MenuRow } from '../components/MenuRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { perfilColors } from '../theme/perfilTokens';

// Datos de ejemplo
const MOCK_USUARIO = {
  nombre: 'Bobo Cervantes',
  telefono: '+52 664 •••• 4421',
  totalReportes: 12,
  reportesActivos: 2,
  reportesHistorial: 10,
  notificacionesNuevas: 3,
  notificacionesHistorial: 10,
  radioAlertasKm: 1.5,
};

interface PerfilScreenProps {
  onBack?: () => void;
  onMisReportes?: () => void;
  onNotificaciones?: () => void;
  onAlertas?: () => void;
  onCerrarSesion?: () => void;
}

export const PerfilScreen = ({
  onBack,
  onMisReportes,
  onNotificaciones,
  onAlertas,
  onCerrarSesion,
}: PerfilScreenProps) => {
  const u = MOCK_USUARIO;
  const [modoOscuro, setModoOscuro] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ScreenHeader onBack={onBack} />
          <Avatar nombre={u.nombre} />
          <Text style={styles.nombre}>{u.nombre}</Text>
          <Text style={styles.telefono}>{u.telefono}</Text>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{u.totalReportes}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </Card>
        </View>

        <Text style={styles.section}>Mi actividad</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="📄"
            title="Mis reportes"
            subtitle={`${u.reportesActivos} activos · ${u.reportesHistorial} en historial`}
            value={String(u.reportesActivos)}
            onPress={onMisReportes}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="🔔"
            title="Notificaciones"
            subtitle={`${u.notificacionesNuevas} hoy · ${u.notificacionesHistorial} en historial`}
            value={String(u.notificacionesNuevas)}
            onPress={onNotificaciones}
          />
        </Card>

        <Text style={styles.section}>Preferencias</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="🌙"
            title="Modo oscuro"
            subtitle="Usa la versión oscura de la aplicación"
            switchValue={modoOscuro}
            onSwitchChange={setModoOscuro}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="🔔"
            title="Alertas y lugares"
            subtitle="Radio, categorías y horario"
            value={`${u.radioAlertasKm} km`}
            onPress={onAlertas}
          />
          <View style={styles.divider} />
          <MenuRow icon="↪" title="Cerrar sesión" danger onPress={onCerrarSesion} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: perfilColors.primaryTint,
    alignItems: 'center',
    paddingBottom: 16,
  },
  nombre: { fontSize: 22, fontWeight: '700', color: perfilColors.textPrimary, marginTop: 12 },
  telefono: { fontSize: 14, color: perfilColors.textSecondary, marginTop: 4 },
  statCard: { alignSelf: 'stretch', alignItems: 'center', marginHorizontal: 16, marginTop: 16, paddingVertical: 12 },
  statNumber: { fontSize: 26, fontWeight: '700', color: perfilColors.textPrimary },
  statLabel: { fontSize: 13, color: perfilColors.textSecondary },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: perfilColors.sectionLabel,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  block: { marginHorizontal: 16 },
  divider: { height: 1, backgroundColor: perfilColors.divider },
});
