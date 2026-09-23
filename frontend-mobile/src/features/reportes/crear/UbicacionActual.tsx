import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { PinDestacadoIcon } from '@/components/icons/PinDestacadoIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAP_HEIGHT = 94;
const PIN_WIDTH = 27;
const PIN_HEIGHT = 43;
const GPS_TIMEOUT_MS = 8000;
// Si no hay fix nuevo, solo se acepta una posición guardada de hace menos de 2 min.
const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;

type Estado = 'detectando' | 'listo' | 'sin-permiso' | 'sin-senal';

interface UbicacionActualProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

const conTiempoLimite = <T,>(promesa: Promise<T>, ms: number) =>
  Promise.race([
    promesa,
    new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error('timeout')), ms)),
  ]);

async function formatearDireccion(latitude: number, longitude: number): Promise<string> {
  try {
    const [r] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!r) return 'Ubicación detectada';
    const calle = [r.street, r.streetNumber].filter(Boolean).join(' ');
    const ciudad = r.city ?? r.region ?? '';
    return [calle, ciudad].filter(Boolean).join(', ') || 'Ubicación detectada';
  } catch {
    return 'Ubicación detectada';
  }
}

export function UbicacionActual({ lat, lng, onLocationChange }: UbicacionActualProps) {
  const [estado, setEstado] = useState<Estado>(lat !== null && lng !== null ? 'listo' : 'detectando');

  const detectar = useCallback(async () => {
    setEstado('detectando');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setEstado('sin-permiso');
        return;
      }
      const posicion = await conTiempoLimite(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        GPS_TIMEOUT_MS,
      ).catch(() => Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }));
      if (!posicion) {
        setEstado('sin-senal');
        return;
      }
      const { latitude, longitude } = posicion.coords;
      onLocationChange(latitude, longitude, await formatearDireccion(latitude, longitude));
      setEstado('listo');
    } catch {
      setEstado('sin-senal');
    }
  }, [onLocationChange]);

  useEffect(() => {
    if (lat === null || lng === null) void detectar();
    // Solo al montar: si ya hay ubicación no se vuelve a pedir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado === 'listo' && lat !== null && lng !== null) {
    return (
      <View style={styles.mapa}>
        <MapLibreGL.Map
          key={`${lat}-${lng}`}
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE}
          touchPitch={false}
          dragPan={false}
          touchZoom={false}
          doubleTapZoom={false}
          doubleTapHoldZoom={false}
          touchRotate={false}
          compass={false}
          logo={false}
          attribution={false}
        >
          <MapLibreGL.Camera initialViewState={{ center: [lng, lat], zoom: 15 }} />
        </MapLibreGL.Map>
        <View
          pointerEvents="none"
          style={[styles.pin, { top: MAP_HEIGHT / 2 - (PIN_HEIGHT - 4), left: '50%', marginLeft: -PIN_WIDTH / 2 }]}
        >
          <PinDestacadoIcon width={PIN_WIDTH} />
        </View>
      </View>
    );
  }

  const fallo = estado === 'sin-permiso' || estado === 'sin-senal';
  return (
    <View style={[styles.mapa, styles.placeholder]}>
      {estado === 'detectando' && (
        <>
          <ActivityIndicator color={colors.slate} />
          <Text style={styles.texto}>Detectando tu ubicación…</Text>
        </>
      )}
      {fallo && (
        <>
          <Text style={styles.texto}>
            {estado === 'sin-permiso'
              ? 'Permiso de ubicación denegado. Actívalo en Configuración.'
              : 'No se pudo obtener tu ubicación.'}
          </Text>
          <Pressable onPress={() => void detectar()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.reintentar}>Reintentar</Text>
          </Pressable>
        </>
      )}
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
  texto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.slate,
    textAlign: 'center',
  },
  reintentar: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.linkBlue,
  },
});
