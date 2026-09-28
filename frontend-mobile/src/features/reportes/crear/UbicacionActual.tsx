import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { PinDestacadoIcon } from '@/components/icons/PinDestacadoIcon';
import { distanciaMetros } from '@/lib/geo';
import { conTiempoLimite, obtenerPosicionActual, type PosicionActual } from '@/lib/ubicacion';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { CorregirUbicacionModal } from './CorregirUbicacionModal';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAP_HEIGHT = 94;
const PIN_WIDTH = 27;
const PIN_HEIGHT = 43;
// Mismo centro que el mapa principal: punto de partida si no hay GPS.
const FALLBACK = { lat: 32.5149, lng: -117.0382 };
// El geocodificador depende de la red: si tarda más, se sigue con una dirección genérica.
const GEOCODIFICAR_TIMEOUT_MS = 3000;
// Un fix nuevo solo mueve el pin si difiere de la posición mostrada más que esto (ruido del GPS).
const AFINAR_MIN_M = 25;

// gps: posición detectada · simulada: sin GPS, ubicación mock (solo con mocks) · manual: el usuario
// movió el pin · fallback: sin GPS ni mocks, centro de Tijuana.
type Origen = 'gps' | 'simulada' | 'manual' | 'fallback';

interface UbicacionActualProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

async function formatearDireccion(latitude: number, longitude: number): Promise<string> {
  try {
    const [r] = await conTiempoLimite(Location.reverseGeocodeAsync({ latitude, longitude }), GEOCODIFICAR_TIMEOUT_MS);
    if (!r) return 'Ubicación detectada';
    const calle = [r.street, r.streetNumber].filter(Boolean).join(' ');
    const ciudad = r.city ?? r.region ?? '';
    return [calle, ciudad].filter(Boolean).join(', ') || 'Ubicación detectada';
  } catch {
    return 'Ubicación detectada';
  }
}

export function UbicacionActual({ lat, lng, onLocationChange }: UbicacionActualProps) {
  const [origen, setOrigen] = useState<Origen>('gps');
  const cameraRef = useRef<MapLibreGL.CameraRef>(null);
  const [corrigiendo, setCorrigiendo] = useState(false);
  // Espejo del estado para el callback que llega tarde (fix nuevo), que no puede leer valores frescos.
  const origenRef = useRef<Origen>('gps');
  const posicionRef = useRef<{ lat: number; lng: number } | null>(lat !== null && lng !== null ? { lat, lng } : null);

  const aplicar = useCallback(
    async (latitude: number, longitude: number, nuevoOrigen: Origen) => {
      setOrigen(nuevoOrigen);
      origenRef.current = nuevoOrigen;
      posicionRef.current = { lat: latitude, lng: longitude };
      const direccion =
        nuevoOrigen === 'fallback' ? 'Tijuana, B.C.' : await formatearDireccion(latitude, longitude);
      onLocationChange(latitude, longitude, direccion);
    },
    [onLocationChange],
  );

  // Llega el fix nuevo tras haber mostrado la última posición conocida: se ajusta el pin, salvo que
  // el usuario ya lo haya movido a mano.
  const afinar = useCallback(
    (fresca: PosicionActual) => {
      const actual = posicionRef.current;
      if (origenRef.current !== 'gps' || (actual && distanciaMetros(actual, fresca) < AFINAR_MIN_M)) return;
      void cameraRef.current?.jumpTo({ center: [fresca.lng, fresca.lat], zoom: 15 });
      void aplicar(fresca.lat, fresca.lng, 'gps');
    },
    [aplicar],
  );

  const detectar = useCallback(async () => {
    try {
      const posicion = await obtenerPosicionActual({ alRefinar: afinar });
      if (!posicion) {
        await aplicar(FALLBACK.lat, FALLBACK.lng, 'fallback');
        return;
      }
      await aplicar(posicion.lat, posicion.lng, posicion.simulada ? 'simulada' : 'gps');
      // "Usar GPS" con el mapa ya montado: la cámara vuela a la posición detectada.
      void cameraRef.current?.flyTo({ center: [posicion.lng, posicion.lat], zoom: 15, duration: 500 });
    } catch (err) {
      // Nunca se traga el error en silencio: sin este log un fallo real
      // (SecurityException, Play Services caído…) no deja rastro.
      console.error('[UbicacionActual] no se pudo detectar la ubicación:', err);
      await aplicar(FALLBACK.lat, FALLBACK.lng, 'fallback');
    }
  }, [aplicar, afinar]);

  useEffect(() => {
    if (lat === null || lng === null) void detectar();
    // Solo al montar: si ya hay ubicación no se vuelve a pedir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El usuario corrigió el punto en el modal: se guarda y la cámara del mini-mapa lo sigue.
  const guardarManual = useCallback(
    async (latitude: number, longitude: number) => {
      setCorrigiendo(false);
      void cameraRef.current?.jumpTo({ center: [longitude, latitude], zoom: 15 });
      await aplicar(latitude, longitude, 'manual');
    },
    [aplicar],
  );

  if (lat === null || lng === null) {
    return (
      <View style={[styles.mapa, styles.placeholder]}>
        <ActivityIndicator color={colors.slate} />
        <Text style={styles.texto}>Detectando tu ubicación…</Text>
      </View>
    );
  }

  const pista =
    origen === 'fallback'
      ? 'No detectamos tu ubicación. Toca el mapa para marcarla.'
      : origen === 'simulada'
        ? 'Ubicación simulada: este dispositivo no entregó GPS. Toca el mapa para ajustarla.'
        : origen === 'manual'
          ? 'Ubicación ajustada manualmente.'
          : 'Toca el mapa si necesitas ajustarla.';

  return (
    <View>
      <View style={styles.mapa}>
        <MapLibreGL.Map
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE}
          touchPitch={false}
          touchRotate={false}
          dragPan={false}
          touchZoom={false}
          doubleTapZoom={false}
          doubleTapHoldZoom={false}
          compass={false}
          logo={false}
          attribution={false}
        >
          <MapLibreGL.Camera ref={cameraRef} initialViewState={{ center: [lng, lat], zoom: 15 }} />
        </MapLibreGL.Map>
        <View
          pointerEvents="none"
          style={[styles.pin, { top: MAP_HEIGHT / 2 - (PIN_HEIGHT - 4), left: '50%', marginLeft: -PIN_WIDTH / 2 }]}
        >
          <PinDestacadoIcon width={PIN_WIDTH} />
        </View>
        {/* Toque en cualquier parte del mapa: abre el modal "Corregir ubicación". */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setCorrigiendo(true)}
          accessibilityRole="button"
          accessibilityLabel="Corregir ubicación"
        />
      </View>
      <CorregirUbicacionModal
        visible={corrigiendo}
        lat={lat}
        lng={lng}
        onCancelar={() => setCorrigiendo(false)}
        onGuardar={(la, ln) => void guardarManual(la, ln)}
      />
      <View style={styles.pie}>
        <Text style={styles.pista} numberOfLines={2}>
          {pista}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapa: {
    height: MAP_HEIGHT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.photoBackground,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  pin: {
    position: 'absolute',
  },
  pie: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pista: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.slate,
  },
  texto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
  },
});
