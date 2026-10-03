import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { useReportes } from '@/features/reportes/hooks';
import { ReporteDetalle } from '@/features/reportes/detalle/ReporteDetalle';
import { MapMarker } from '@/features/mapa/MapMarker';
import { MapSearchBar } from '@/features/mapa/MapSearchBar';
import { PuntoUsuario } from '@/features/mapa/PuntoUsuario';
import { ReportarFab } from '@/features/mapa/ReportarFab';
import { UbicacionFab } from '@/features/mapa/UbicacionFab';
import { useMapaTargetStore } from '@/features/mapa/mapaTargetStore';
import { obtenerPosicionActual, tienePermisoUbicacion, type Coordenadas } from '@/lib/ubicacion';
import type { Reporte } from '@/types/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const TARGET_ZOOM = 15;
const MI_UBICACION_ZOOM = 16;
const AVISO_MS = 3500;
// Pausa tras el último movimiento antes de volver a ensanchar "Reportar".
const QUIETO_MS = 600;
const SIN_PADDING = { top: 0, right: 0, bottom: 0, left: 0 };

// Medidas de la pantalla "Ver reporte" (Figma 22).
const BUSCADOR_ALTO = 60;
const SEPARACION_BUSCADOR = 26;
const FAB_ALTO = 60;
const SEPARACION_FAB = 31;
// Separación entre el botón de ubicación y el de reportar (Figma 10): alto del botón + 21.
const UBICACION_SOBRE_FAB = FAB_ALTO + 21;

export default function MainMap() {
  const insets = useSafeAreaInsets();
  const { height: pantallaAlto } = useWindowDimensions();
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const { data: reportes = [] } = useReportes();

  const [expandido, setExpandido] = useState(true);
  const [permisoUbicacion, setPermisoUbicacion] = useState(false);
  const [miPosicionSimulada, setMiPosicionSimulada] = useState<Coordenadas | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

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

  // Punto azul del usuario: solo si el permiso ya se concedió (no se pide al abrir el mapa).
  useEffect(() => {
    void tienePermisoUbicacion().then(setPermisoUbicacion).catch(() => setPermisoUbicacion(false));
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), AVISO_MS);
    return () => clearTimeout(t);
  }, [aviso]);

  // "Reportar" nace ensanchado (Figma 10) y se contrae a círculo (Figma 11) en cuanto el usuario
  // mueve el mapa; vuelve a ensancharse cuando el mapa se queda quieto (`onRegionDidChange` más
  // una breve pausa, para no parpadear entre gesto y gesto). Los vuelos de cámara del propio
  // código (`userInteraction: false`) no lo contraen.
  const quietoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelarQuieto = useCallback(() => {
    if (quietoTimer.current) clearTimeout(quietoTimer.current);
    quietoTimer.current = null;
  }, []);

  const alMoverse = useCallback(
    (e: { nativeEvent: { userInteraction: boolean } }) => {
      if (!e.nativeEvent.userInteraction) return;
      cancelarQuieto();
      setExpandido(false);
    },
    [cancelarQuieto],
  );

  const alQuedarseQuieto = useCallback(() => {
    cancelarQuieto();
    quietoTimer.current = setTimeout(() => setExpandido(true), QUIETO_MS);
  }, [cancelarQuieto]);

  useEffect(() => cancelarQuieto, [cancelarQuieto]);

  const irAMiUbicacion = useCallback(async () => {
    setBuscandoUbicacion(true);
    try {
      const posicion = await obtenerPosicionActual();
      if (!posicion) {
        setAviso('No pudimos obtener tu ubicación. Revisa el permiso y el GPS.');
        return;
      }
      setPermisoUbicacion(true);
      // Sin GPS (emulador en PC) y con mocks, `posicion.simulada`: el punto azul lo dibujamos
      // nosotros porque el nativo no tiene posición que mostrar.
      setMiPosicionSimulada(posicion.simulada ? { lat: posicion.lat, lng: posicion.lng } : null);
      setExpandido(true);
      cameraRef.current?.flyTo({
        center: [posicion.lng, posicion.lat],
        zoom: MI_UBICACION_ZOOM,
        duration: 800,
        padding: SIN_PADDING,
      });
    } catch (err) {
      console.error('[MainMap] no se pudo obtener la ubicación actual:', err);
      setAviso('No pudimos obtener tu ubicación. Intenta de nuevo.');
    } finally {
      setBuscandoUbicacion(false);
    }
  }, []);

  // Al elegir un resultado en "Buscar dirección" (app/(main)/buscar.tsx), la cámara vuela hasta
  // ahí. No se marca el punto con ningún pin: es para explorar los reportes de esa zona.
  useEffect(() => {
    if (target && !target.reporteId) {
      cameraRef.current?.flyTo({ center: [target.lng, target.lat], zoom: TARGET_ZOOM, duration: 1200, padding: SIN_PADDING });
      clearTarget();
    }
  }, [target, clearTarget]);

  // "Ver reporte" desde la pantalla de éxito: abre la tarjeta del reporte recién creado/confirmado.
  useEffect(() => {
    if (!target?.reporteId) return;
    const reporte = reportes.find((r) => r.id === target.reporteId);
    if (!reporte) return;
    seleccionar(reporte);
    // Se libera el target para que no reabra la tarjeta cada vez que se refresque la lista.
    clearTarget();
  }, [target, reportes, clearTarget, seleccionar]);

  return (
    <View style={styles.container}>
      <MapLibreGL.Map
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE}
        logo={false}
        attribution={false}
        onRegionWillChange={alMoverse}
        onRegionDidChange={alQuedarseQuieto}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          initialViewState={{
            center: [-117.0382, 32.5149],
            zoom: 11,
          }}
        />
        {permisoUbicacion && !miPosicionSimulada && <MapLibreGL.UserLocation />}
        {miPosicionSimulada && (
          <MapLibreGL.Marker id="mi-posicion-simulada" lngLat={[miPosicionSimulada.lng, miPosicionSimulada.lat]}>
            <PuntoUsuario />
          </MapLibreGL.Marker>
        )}
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
        <>
          <View style={[styles.ubicacionWrapper, { bottom: fabBottom + UBICACION_SOBRE_FAB }]} pointerEvents="box-none">
            {aviso && (
              <View style={styles.aviso}>
                <Text style={styles.avisoTexto}>{aviso}</Text>
              </View>
            )}
            <UbicacionFab onPress={() => void irAMiUbicacion()} cargando={buscandoUbicacion} />
          </View>
          <View style={[styles.fabWrapper, { bottom: fabBottom }]} pointerEvents="box-none">
            <ReportarFab expandido={expandido} onPress={() => router.push('/(main)/crear-reporte')} />
          </View>
        </>
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
  ubicacionWrapper: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    gap: 8,
  },
  aviso: {
    maxWidth: 260,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  avisoTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.white,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrimMapa,
  },
});
