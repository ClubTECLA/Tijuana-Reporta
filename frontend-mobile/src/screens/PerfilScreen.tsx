import React, { useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { MenuRow } from '../components/MenuRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { EstadoVista } from '../components/estado/EstadoVista';
import { perfilColors } from '../theme/perfilTokens';

// TODO: no existe endpoint de "reportes del usuario", notificaciones ni preferencias de alertas.
// Estos contadores siguen siendo datos de ejemplo hasta que el backend los ofrezca.
const MOCK_CONTADORES = {
  totalReportes: 12,
  reportesActivos: 2,
  reportesHistorial: 10,
  notificacionesNuevas: 3,
  notificacionesHistorial: 10,
  radioAlertasKm: 1.5,
};

interface PerfilScreenProps {
  nombre: string;
  correo?: string;
  cargando?: boolean;
  error?: boolean;
  onReintentar?: () => void;
  onBack?: () => void;
  onMisReportes?: () => void;
  onNotificaciones?: () => void;
  onAlertas?: () => void;
  onCerrarSesion?: () => void;
}

export const PerfilScreen = ({
  nombre,
  correo,
  cargando,
  error,
  onReintentar,
  onBack,
  onMisReportes,
  onNotificaciones,
  onAlertas,
  onCerrarSesion,
}: PerfilScreenProps) => {
  const u = MOCK_CONTADORES;
  const [modoOscuro, setModoOscuro] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ScreenHeader onBack={onBack} />
          {cargando ? (
            <ActivityIndicator color={perfilColors.primary} style={styles.cargando} />
          ) : error ? (
            <EstadoVista estado="error" mensaje="No se pudo cargar tu perfil." onReintentar={onReintentar} compacto />
          ) : (
            <>
              <Avatar nombre={nombre} />
              <Text style={styles.nombre}>{nombre}</Text>
              {correo ? <Text style={styles.correo}>{correo}</Text> : null}
            </>
          )}
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{u.totalReportes}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </Card>
        </View>

        <Text style={styles.section}>Mi actividad</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="file-text"
            title="Mis reportes"
            subtitle={`${u.reportesActivos} activos · ${u.reportesHistorial} en historial`}
            value={String(u.reportesActivos)}
            onPress={onMisReportes}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="bell"
            title="Notificaciones"
            subtitle={`${u.notificacionesNuevas} hoy · ${u.notificacionesHistorial} en historial`}
            value={String(u.notificacionesNuevas)}
            onPress={onNotificaciones}
          />
        </Card>

        <Text style={styles.section}>Preferencias</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="moon"
            title="Modo oscuro"
            subtitle="Usa la versión oscura de la aplicación"
            switchValue={modoOscuro}
            onSwitchChange={setModoOscuro}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="map-pin"
            title="Alertas y lugares"
            subtitle="Radio, categorías y horario"
            value={`${u.radioAlertasKm} km`}
            onPress={onAlertas}
          />
          <View style={styles.divider} />
          <MenuRow icon="log-out" title="Cerrar sesión" danger onPress={onCerrarSesion} />
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
  cargando: { marginVertical: 40 },
  nombre: { fontSize: 22, fontWeight: '700', color: perfilColors.textPrimary, marginTop: 12 },
  correo: { fontSize: 14, color: perfilColors.textSecondary, marginTop: 4 },
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