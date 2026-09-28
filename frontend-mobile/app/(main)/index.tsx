import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '@/theme/colors';
import { useApoyarReporte, useReportes } from '@/features/reportes/hooks';
import { MapMarker } from '@/features/mapa/MapMarker';
import { MapSearchBar } from '@/features/mapa/MapSearchBar';
import { ReportarFab } from '@/features/mapa/ReportarFab';
import { useMapaTargetStore } from '@/features/mapa/mapaTargetStore';
import { PinDestacadoIcon } from '@/components/icons/PinDestacadoIcon';
import { IncidentCard } from '@/components/IncidentCard';
import type { Reporte } from '@/types/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const TARGET_ZOOM = 15;

export default function MainMap() {
  const insets = useSafeAreaInsets();
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const { data: reportes = [] } = useReportes();
  const apoyar = useApoyarReporte();

  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const target = useMapaTargetStore((s) => s.target);

  // Al elegir un resultado en "Buscar dirección" (app/(main)/buscar.tsx), la
  // cámara vuela hasta ahí y se marca el destino con un pin temporal.
  useEffect(() => {
    if (target) void cameraRef.current?.flyTo({ center: [target.lng, target.lat], zoom: TARGET_ZOOM, duration: 1200 });
  }, [target]);

  return (
    <View style={styles.container}>
      <MapLibreGL.Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE}
        logo={false}
        attribution={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          initialViewState={{
            center: [-117.0382, 32.5149],
            zoom: 11,
          }}
        />
        {reportes.map((reporte) => (
          <MapLibreGL.Marker
            key={reporte.id}
            id={reporte.id}
            lngLat={[reporte.lng, reporte.lat]}
            onPress={() => setSelectedReporte(reporte)}
          >
            <MapMarker categoria={reporte.categorias[0]} halo={selectedReporte?.id === reporte.id} />
          </MapLibreGL.Marker>
        ))}
        {target && (
          <MapLibreGL.Marker id="destino-busqueda" lngLat={[target.lng, target.lat]} anchor="bottom">
            <PinDestacadoIcon width={27} />
          </MapLibreGL.Marker>
        )}
      </MapLibreGL.Map>

      <View style={[styles.searchWrapper, { top: insets.top + 8 }]} pointerEvents="box-none">
        <MapSearchBar onPress={() => router.push('/(main)/buscar')} />
      </View>

      <View style={[styles.fabWrapper, { bottom: Math.max(insets.bottom + 8, 42) }]} pointerEvents="box-none">
        <ReportarFab onPress={() => router.push('/(main)/crear-reporte')} />
      </View>

      <IncidentCard
        reporte={selectedReporte}
        onClose={() => {
          apoyar.reset();
          setSelectedReporte(null);
        }}
        apoyando={apoyar.isPending}
        apoyarError={apoyar.isError}
        onApoyar={(id) =>
          apoyar.mutate(id, {
            onSuccess: () => setSelectedReporte(null),
          })
        }
        onVerDetalle={(id) => {
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
    backgroundColor: colors.appBackground,
  },
  searchWrapper: {
    position: 'absolute',
    left: 10,
    right: 10,
  },
  fabWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
