import * as Location from 'expo-location';
import { env } from '@/lib/env';

// Un fix nuevo de GPS tarda entre ~1.5 s (GPS tibio) y más de 8 s (frío, o sin señal), y no hay
// forma de acelerarlo; lo que sí se puede es no esperarlo: la última posición conocida sale en
// milisegundos, así que se usa de inmediato y el fix nuevo solo la afina en segundo plano.
const FIX_TIMEOUT_MS = 8000;
// Con mocks (dev) y sin posición en caché, el emulador de una PC nunca va a dar fix: no se le
// hace esperar el timeout completo antes de caer a la ubicación simulada.
const FIX_TIMEOUT_SIN_CACHE_MOCK_MS = 4000;
// Una posición guardada solo se acepta si es reciente y razonablemente precisa.
const CACHE_MAX_EDAD_MS = 5 * 60 * 1000;
const CACHE_PRECISION_MAX_M = 200;

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface PosicionActual extends Coordenadas {
  /** true si no hubo GPS y se usó `UBICACION_SIMULADA` (solo con mocks activos). */
  simulada: boolean;
}

export interface OpcionesPosicion {
  /** Si la posición devuelta salió de la caché, se llama con el fix nuevo cuando llega. */
  alRefinar?: (posicion: PosicionActual) => void;
}

// Zona Río, a ~90 m del reporte mock "Árbol caído sobre cableado": sirve para probar
// flujos que dependen de estar cerca de un reporte (duplicados, confirmar in situ).
export const UBICACION_SIMULADA: Coordenadas = { lat: 32.5262, lng: -117.0203 };

const TIMEOUT = 'timeout';

/** Rechaza con `Error('timeout')` si la promesa no resuelve a tiempo. */
export const conTiempoLimite = <T,>(promesa: Promise<T>, ms: number) =>
  Promise.race([
    promesa,
    new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new Error(TIMEOUT)), ms)),
  ]);

/** Sin mostrar el diálogo de permiso: ¿ya se concedió el acceso a la ubicación? */
export async function tienePermisoUbicacion(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

/** Extrae latitud y longitud de una posición de Expo al formato usado por la aplicación. */
const aCoordenadas = (posicion: Location.LocationObject): Coordenadas => ({
  lat: posicion.coords.latitude,
  lng: posicion.coords.longitude,
});

/** Fix nuevo del GPS, o `null` si no llegó a tiempo. Otros errores (módulo nativo) se propagan. */
async function posicionFresca(timeoutMs: number): Promise<Coordenadas | null> {
  try {
    const posicion = await conTiempoLimite(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs,
    );
    return aCoordenadas(posicion);
  } catch (err) {
    if (err instanceof Error && err.message === TIMEOUT) return null;
    throw err;
  }
}

// Seguimiento en primer plano: un fix nuevo solo si se movió esto (o pasó este tiempo, en Android), para
// mantener el punto al día sin encender el GPS a tope.
const SEGUIMIENTO_DISTANCIA_M = 10;
const SEGUIMIENTO_TIEMPO_MS = 5000;

/**
 * Sigue la posición del dispositivo mientras la app está abierta: llama a `alCambiar` con cada fix nuevo.
 * Devuelve la función que cancela el seguimiento (hay que llamarla al desmontar). No pide permisos: quien la
 * llama debe haber comprobado que ya están concedidos.
 */
export async function seguirPosicion(alCambiar: (posicion: Coordenadas) => void): Promise<() => void> {
  const suscripcion = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: SEGUIMIENTO_DISTANCIA_M,
      timeInterval: SEGUIMIENTO_TIEMPO_MS,
    },
    (posicion) => alCambiar(aCoordenadas(posicion)),
  );
  return () => suscripcion.remove();
}

/** Posición actual del dispositivo, o `null` si no hay permiso o no se obtuvo posición.
 *
 * Devuelve al instante la última posición conocida (si es reciente y precisa) y, en paralelo,
 * pide un fix nuevo: cuando llega, se avisa por `opciones.alRefinar`. Sin posición en caché
 * espera el fix nuevo.
 *
 * Con mocks activos (`EXPO_PUBLIC_USE_MOCKS`), si no hay ninguna posición —típico del emulador
 * en una PC— se devuelve `UBICACION_SIMULADA` con `simulada: true`. Con un dispositivo que sí
 * detecta ubicación se usa la real. Sin mocks nunca se inventa una posición: si el módulo
 * nativo falla, el error se propaga para que el llamador lo registre. */
export async function obtenerPosicionActual(opciones: OpcionesPosicion = {}): Promise<PosicionActual | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const enCache = await Location.getLastKnownPositionAsync({
    maxAge: CACHE_MAX_EDAD_MS,
    requiredAccuracy: CACHE_PRECISION_MAX_M,
  }).catch(() => null);

  if (enCache) {
    // Ya hay algo que mostrar: el fix nuevo solo lo afina, y si falla no pasa nada.
    posicionFresca(FIX_TIMEOUT_MS)
      .then((fresca) => {
        if (fresca) opciones.alRefinar?.({ ...fresca, simulada: false });
      })
      .catch((err) => console.warn('[ubicacion] no se pudo afinar la posición:', err));
    return { ...aCoordenadas(enCache), simulada: false };
  }

  try {
    const real = await posicionFresca(env.useMocks ? FIX_TIMEOUT_SIN_CACHE_MOCK_MS : FIX_TIMEOUT_MS);
    if (real) return { ...real, simulada: false };
  } catch (err) {
    if (!env.useMocks) throw err;
    console.warn('[ubicacion] el GPS falló, se usa la ubicación simulada:', err);
  }
  return env.useMocks ? { ...UBICACION_SIMULADA, simulada: true } : null;
}
