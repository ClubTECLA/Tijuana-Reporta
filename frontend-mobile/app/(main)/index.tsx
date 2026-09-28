import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '@/theme/colors';
import { useReportes } from '@/features/reportes/hooks';
import { ReporteDetalle } from '@/features/reportes/detalle/ReporteDetalle';
import { MapMarker } from '@/features/mapa/MapMarker';
import { MapSearchBar } from '@/features/mapa/MapSearchBar';
import { ReportarFab } from '@/features/mapa/ReportarFab';
import { useMapaTargetStore } from '@/features/mapa/mapaTargetStore';
import { PinDestacadoIcon } from '@/components/icons/PinDestacadoIcon';
import type { Reporte } from '@/types/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const TARGET_ZOOM = 15;
const SIN_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

// Medidas de la pantalla "Ver reporte" (Figma 22).
const BUSCADOR_ALTO = 60;
const SEPARACION_BUSCADOR = 26;
const FAB_ALTO = 60;
const SEPARACION_FAB = 31;

export default function MainMap() {
  const insets = useSafeAreaInsets();
  const { height: pantallaAlto } = useWindowDimensions();
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const { data: reportes = [] } = useReportes();

  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const target = useMapaTargetStore((s) => s.target);
  const clearTarget = useMapaTargetStore((s) => s.clear);

  const buscadorTop = insets.top + 8;
  const fabBottom = Math.max(insets.bottom + 8, 42);
  const tarjetaTop = buscadorTop + BUSCADOR_ALTO + SEPARACION_BUSCADOR;
  const tarjetaBottom = fabBottom + FAB_ALTO + SEPARACION_FAB;

  // Abre la tarjeta y desplaza el mapa para que el pin quede en la franja libre bajo ella
  // (el `padding` superior reduce la zona "visible" del mapa a esa franja).
  const seleccionar = useCallback(
    (reporte: Reporte) => {
      setSelectedReporte(reporte);
      cameraRef.current?.flyTo({
        center: [reporte.lng, reporte.lat],
        duration: 700,
        padding: { ...SIN_PADDING, top: pantallaAlto - tarjetaBottom },
      });
    },
    [pantallaAlto, tarjetaBottom],
  );

  // Al elegir un resultado en "Buscar dirección" (app/(main)/buscar.tsx), la
  // cámara vuela hasta ahí y se marca el destino con un pin temporal.
  useEffect(() => {
    if (target && !target.reporteId) {
      cameraRef.current?.flyTo({ center: [target.lng, target.lat], zoom: TARGET_ZOOM, duration: 1200, padding: SIN_PADDING });
    }
  }, [target]);

  // "Ver reporte" desde la pantalla de éxito: abre la tarjeta del reporte recién creado/confirmado.
  useEffect(() => {
    if (!target?.reporteId) return;
    const reporte = reportes.find((r) => r.id === target.reporteId);
    if (!reporte) return;
    seleccionar(reporte);
    // El reporte ya tiene su propio marcador: se libera el target para que no
    // reabra la tarjeta cada vez que se refresque la lista.
    clearTarget();
  }, [target, reportes, clearTarget, seleccionar]);

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
            onPress={() => seleccionar(reporte)}
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

      <View style={[styles.searchWrapper, { top: buscadorTop }]} pointerEvents="box-none">
        <MapSearchBar onPress={() => router.push('/(main)/buscar')} />
      </View>

      {selectedReporte ? (
        <>
          {/* Desvanecimiento del mapa: tocarlo cierra la tarjeta. */}
          <Pressable
            style={styles.scrim}
            onPress={() => setSelectedReporte(null)}
            accessibilityLabel="Cerrar reporte"
          />
          <ReporteDetalle
            reporte={selectedReporte}
            top={tarjetaTop}
            bottom={tarjetaBottom}
            onClose={() => setSelectedReporte(null)}
          />
        </>
      ) : (
        <View style={[styles.fabWrapper, { bottom: fabBottom }]} pointerEvents="box-none">
          <ReportarFab onPress={() => router.push('/(main)/crear-reporte')} />
        </View>
      )}
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
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrimMapa,
  },
});
