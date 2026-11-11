import React, { useCallback, useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { leerRadioAlertaKm, RADIO_ALERTA_KM_DEFECTO } from '../lib/alertasCercanas';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { MenuRow } from '../components/MenuRow';
import { ScreenHeader } from '../components/ScreenHeader';
import { EstadoVista } from '../components/estado/EstadoVista';
import { perfilColors } from '../theme/perfilTokens';

interface PerfilScreenProps {
  nombre: string;
  correo?: string;
  reportesActivos?: number;
  reportesCerrados?: number;
  cargando?: boolean;
  sinConexion?: boolean;
  error?: boolean;
  onReintentar?: () => void;
  onBack?: () => void;
  onMisReportes?: () => void;
  onAlertas?: () => void;
  onCerrarSesion?: () => void;
}

export const PerfilScreen = ({
  nombre,
  correo,
  reportesActivos,
  reportesCerrados,
  cargando,
  sinConexion,
  error,
  onReintentar,
  onBack,
  onMisReportes,
  onAlertas,
  onCerrarSesion,
}: PerfilScreenProps) => {
  const total =
    reportesActivos !== undefined && reportesCerrados !== undefined ? reportesActivos + reportesCerrados : undefined;  

  // Perfil sigue montado debajo de "Alertas y lugares": se relee al volver para mostrar lo que se guardó.
  const [radioAlertasKm, setRadioAlertasKm] = useState(RADIO_ALERTA_KM_DEFECTO);
  useFocusEffect(
    useCallback(() => {
      leerRadioAlertaKm().then(setRadioAlertasKm).catch(() => {});
    }, []),
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ScreenHeader onBack={onBack} />
          {cargando ? (
            <ActivityIndicator color={perfilColors.primary} style={styles.cargando} />
          ) : sinConexion ? (
            <EstadoVista estado="sin-conexion" mensaje="Sin conexión: tu perfil se cargará al reconectar." compacto />
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
            <Text style={styles.statNumber}>{total ?? '-'}</Text>
            <Text style={styles.statLabel}>Reportes</Text>
          </Card>
        </View>

        <Text style={styles.section}>Mi actividad</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="file-text"
            title="Mis reportes"
            subtitle={total !== undefined ? `${reportesActivos} ${reportesActivos === 1 ? 'activo' : 'activos'} · ${total} en historial` : 'Toca para ver tus reportes'}
            value={reportesActivos !== undefined ? String(reportesActivos) : undefined}
            onPress={onMisReportes}
          />
        </Card>

        <Text style={styles.section}>Preferencias</Text>
        <Card style={styles.block}>
          <MenuRow
            icon="map-pin"
            title="Alertas y lugares"
            subtitle="Radio, categorías y horario"
            value={`${radioAlertasKm.toFixed(1)} km`}
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