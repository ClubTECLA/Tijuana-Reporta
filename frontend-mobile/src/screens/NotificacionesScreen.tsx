import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NotificationRow } from '../components/NotificationRow';
import { SegmentedTabs } from '../components/SegmentedTabs';
import { Card } from '../components/Card';
import { EstadoVista } from '../components/estado/EstadoVista';
import { Notificacion } from '../types/notificacion';
import { perfilColors } from '../theme/perfilTokens';

// Datos de ejemplo
const MOCK_NOTIFICACIONES: Notificacion[] = [
  {
    id: '1',
    tipo: 'alerta',
    titulo: 'Deslave a 300 m de ti',
    subtitulo: 'Aviso oficial en Cañón del Saíz. Evita la zona.',
    tiempo: 'hace 3 min',
    grupo: 'Hoy',
    leida: false,
  },
  {
    id: '2',
    tipo: 'info',
    titulo: 'Tu reporte fue agrupado',
    subtitulo: 'REP-8814 ahora es parte de INC-2471.',
    tiempo: 'hace 28 min',
    grupo: 'Hoy',
    leida: false,
  },
  {
    id: '3',
    tipo: 'comentario',
    titulo: 'José M. respondió',
    subtitulo: 'Ya se está haciendo revisión de este incidente',
    tiempo: 'hace 1 h',
    grupo: 'Hoy',
    leida: true,
  },
  {
    id: '4',
    tipo: 'exito',
    titulo: 'Incidente resuelto',
    subtitulo: 'La inundación en Blvd. Díaz Ordaz ya no está activa.',
    tiempo: 'ayer',
    grupo: 'Ayer',
    leida: true,
  },
  {
    id: '5',
    tipo: 'aviso',
    titulo: 'Pronóstico de lluvia intensa',
    subtitulo: 'Protección Civil recomienda evitar cauces esta noche.',
    tiempo: 'ayer',
    grupo: 'Ayer',
    leida: true,
  },
];

const TABS = ['Todas', 'Alertas', 'Mis reportes'] as const;
type Tab = (typeof TABS)[number];

const VACIO_POR_TAB: Record<Tab, { titulo: string; mensaje: string }> = {
  Todas: { titulo: 'Sin notificaciones', mensaje: 'Aquí verás alertas cercanas y novedades de tus reportes.' },
  Alertas: { titulo: 'Sin alertas', mensaje: 'Te avisaremos si ocurre algo cerca de ti.' },
  'Mis reportes': { titulo: 'Sin novedades', mensaje: 'Cuando tus reportes cambien de estado lo verás aquí.' },
};

interface NotificacionesScreenProps {
  onBack?: () => void;
}

export const NotificacionesScreen = ({ onBack }: NotificacionesScreenProps) => {
  const [tab, setTab] = useState<Tab>('Todas');
  const [notificaciones, setNotificaciones] = useState(MOCK_NOTIFICACIONES);

  const filtradas = notificaciones.filter((n) => {
    if (tab === 'Alertas') return n.tipo === 'alerta' || n.tipo === 'aviso';
    if (tab === 'Mis reportes') return n.tipo === 'info' || n.tipo === 'exito' || n.tipo === 'comentario';
    return true;
  });

  const marcarLeidas = () => setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));

  const grupos: Array<'Hoy' | 'Ayer'> = ['Hoy', 'Ayer'];

  return (
        <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Notificaciones</Text>
        <TouchableOpacity style={styles.marcarBtn} onPress={marcarLeidas} accessibilityRole="button">
          <Text style={styles.marcarText}>Marcar leídas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedTabs options={TABS} selected={tab} onSelect={setTab} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filtradas.length === 0 && (
          <EstadoVista estado="vacio" titulo={VACIO_POR_TAB[tab].titulo} mensaje={VACIO_POR_TAB[tab].mensaje} />
        )}
        {grupos.map((grupo) => {
          const items = filtradas.filter((n) => n.grupo === grupo);
          if (items.length === 0) return null;
          return (
            <View key={grupo}>
              <Text style={styles.section}>{grupo}</Text>
              <Card style={styles.card}>
                {items.map((n, index) => (
                  <View key={n.id}>
                    <NotificationRow notificacion={n} />
                    {index < items.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: perfilColors.screenBg },
    header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
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
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: perfilColors.textPrimary,
  },
  marcarBtn: { marginLeft: 8 },
  marcarText: { color: perfilColors.primary, fontWeight: '600', fontSize: 13 },
  tabsWrap: { paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: perfilColors.sectionLabel,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  card: { marginBottom: 16 },
  divider: { height: 1, backgroundColor: perfilColors.divider, marginLeft: 48 },
});
