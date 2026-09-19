import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { mockReportes } from '../../src/mocks/reportes';
import { CategoriaReporte, Reporte } from '../../src/types/api';
import { IncidentCard } from '../../src/components/IncidentCard';

const TIJUANA_REGION = {
  latitude: 32.5149,
  longitude: -117.0382,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const CATEGORIES: { id: CategoriaReporte | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'inundacion', label: 'Inundación' },
  { id: 'deslave', label: 'Deslave' },
  { id: 'drenaje', label: 'Drenaje' },
  { id: 'arbol', label: 'Árbol/poste' },
  { id: 'socavon', label: 'Socavón' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'luz', label: 'Luz' },
  { id: 'peligro', label: 'Peligro' },
  { id: 'otro', label: 'Otro' },
];

const CATEGORIA_EMOJI: Record<CategoriaReporte, string> = {
  socavon: '🕳️',
  peligro: '⚠️',
  drenaje: '🌀',
  luz: '💡',
  deslave: '⛰️',
  arbol: '🌳',
  inundacion: '🌊',
  servicios: '🔧',
  otro: '📍',
};

export default function MainMap() {
  const [selectedCategory, setSelectedCategory] = useState<CategoriaReporte | 'todos'>('todos');
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);

  const filteredReportes =
    selectedCategory === 'todos'
      ? mockReportes
      : mockReportes.filter(r => r.categoria === selectedCategory);

  // Conteos por categoría para los badges
  const countsByCategoria = mockReportes.reduce<Record<string, number>>((acc, r) => {
    acc[r.categoria] = (acc[r.categoria] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Mapa a pantalla completa */}
      <MapView
        style={styles.map}
        initialRegion={TIJUANA_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filteredReportes.map(reporte => (
          <Marker
            key={reporte.id}
            coordinate={{ latitude: reporte.lat, longitude: reporte.lng }}
            onPress={() => setSelectedReporte(reporte)}
          >
            {/* Marcador personalizado con emoji de la categoría */}
            <View style={styles.markerContainer}>
              <View style={[
                styles.markerBubble,
                selectedReporte?.id === reporte.id && styles.markerBubbleSelected,
              ]}>
                <Text style={styles.markerEmoji}>
                  {CATEGORIA_EMOJI[reporte.categoria]}
                </Text>
              </View>
              <View style={[
                styles.markerTail,
                selectedReporte?.id === reporte.id && styles.markerTailSelected,
              ]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Overlay superior: barra de búsqueda + filtros */}
      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Barra de búsqueda */}
        <View style={styles.header}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchText}>Buscar dirección...</Text>
          </View>
        </View>

        {/* Chips de filtro */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'todos' ? mockReportes.length : (countsByCategoria[cat.id] ?? 0);
              return (
                <Pressable
                  key={cat.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                      <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* FAB - Botón Reportar */}
      <Pressable
        style={({ pressed }) => [styles.reportButton, pressed && styles.reportButtonPressed]}
        onPress={() => router.push('/(main)/crear-reporte')}
      >
        <Text style={styles.reportButtonText}>+ Reportar</Text>
      </Pressable>

      {/* IncidentCard - Bottom Sheet al seleccionar marcador */}
      <IncidentCard
        reporte={selectedReporte}
        onClose={() => setSelectedReporte(null)}
        onApoyar={id => {
          // TODO: conectar con API — por ahora solo cierra
          console.log('Apoyar reporte:', id);
        }}
        onVerDetalle={id => {
          // TODO: navegar a pantalla de detalle
          console.log('Ver detalle:', id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Header / Búsqueda
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchText: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textMuted,
    flex: 1,
  },

  // Filtros
  filtersContainer: {
    height: 56,
  },
  filtersScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.headingDark,
  },
  chipTextSelected: {
    color: colors.white,
  },
  badge: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    color: colors.headingDark,
  },
  badgeTextSelected: {
    color: colors.white,
  },

  // Marcadores
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerBubbleSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.15 }],
  },
  markerEmoji: {
    fontSize: 20,
  },
  markerTail: {
    width: 8,
    height: 8,
    backgroundColor: colors.white,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  markerTailSelected: {
    backgroundColor: colors.primary,
  },

  // FAB
  reportButton: {
    position: 'absolute',
    bottom: 44,
    alignSelf: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reportButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  reportButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
});
