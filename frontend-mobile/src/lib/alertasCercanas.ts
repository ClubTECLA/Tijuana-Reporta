import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { reportesApi } from '@/features/reportes/api';
import { asegurarCanalAlertas, CANAL_ALERTAS } from '@/lib/notificaciones';
import { registrarAlerta, type RegistroAlertas } from '@/lib/limiteAlertas';
import { obtenerPosicionActual } from '@/lib/ubicacion';

const TAREA_ZONAS = 'zonas-peligro';
const CLAVE_REGISTRO = 'alertas:avisadas-hoy';
const TAREA_MOVIMIENTO = 'zonas-peligro-movimiento';
// Con RADIO_BUSQUEDA_M de 5 km, refrescar cada 1 km mantiene vigiladas las zonas de alrededor.
const REFRESCO_M = 1000;
// Se buscan incidentes en este radio y se vigila alrededor de cada uno un círculo del radio que
// elija el usuario (de 0.5 a 3 km en "Alertas y lugares").
const RADIO_BUSQUEDA_M = 5000;
const CLAVE_RADIO = 'alertas:radio-km';
// Coincide con lo que promete la pantalla "Recibe alertas cercanas".
export const RADIO_ALERTA_KM_DEFECTO = 1.5;
// iOS vigila como máximo 20 regiones a la vez (Android 100): se toman las más cercanas.
const MAX_ZONAS = 20;

interface EventoZona {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}

// Debe definirse en el ámbito global: cuando el sistema despierta la app en segundo plano no se
// monta ninguna vista, solo se carga este módulo (importado desde app/_layout.tsx).
TaskManager.defineTask<EventoZona>(TAREA_ZONAS, async ({ data, error }) => {
  if (error || data.eventType !== Location.GeofencingEventType.Enter) return;
  // El identificador de la región es "id|título" para poder nombrar el incidente sin red.
  const [id, ...resto] = (data.region.identifier ?? '').split('|');
  if (!id) return;
  const titulo = resto.join('|') || 'Incidente reportado';

  // Salir y volver a entrar (o el GPS oscilando en el borde) dispara otro Enter: se avisa una vez por día.
  const d = new Date();
  const hoy = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let previo: RegistroAlertas | null = null;
  try {
    previo = JSON.parse((await AsyncStorage.getItem(CLAVE_REGISTRO)) ?? 'null') as RegistroAlertas | null;
  } catch {
    // Registro ilegible: se empieza de cero antes que dejar de avisar.
  }
  const registro = registrarAlerta(previo, id, hoy);
  if (!registro) return;
  await AsyncStorage.setItem(CLAVE_REGISTRO, JSON.stringify(registro)).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Estás entrando a una zona de peligro',
      body: `${titulo} a menos de ${formatoDistancia(data.region.radius)}. Toma precauciones.`,
    },
    trigger: { channelId: CANAL_ALERTAS },
  });
});

// Cada REFRESCO_M recorridos llega una posición nueva y se vuelven a tomar los incidentes de alrededor.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TAREA_MOVIMIENTO, async ({ data, error }) => {
  const ultima = data?.locations?.at(-1);
  if (error || !ultima) return;
  await registrarZonas(ultima.coords.latitude, ultima.coords.longitude).catch((err) =>
    console.warn('[alertas] no se pudieron refrescar las zonas tras moverse:', err),
  );
});

// Sin esto, una alerta que llega con la app abierta no se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pide la ubicación "todo el tiempo" (requiere tener ya la de primer plano). Devuelve si quedó concedida.
 *
 * En Android 11+ abre la página de ajustes de la app: la pantalla que lo llama debe explicar antes por qué. */
export async function pedirUbicacionEnSegundoPlano(): Promise<boolean> {
  const primerPlano = await Location.requestForegroundPermissionsAsync();
  if (!primerPlano.granted) return false;
  const { granted } = await Location.requestBackgroundPermissionsAsync();
  return granted;
}

/** Para quien negó el permiso antes (o en iOS eligió "Permitir una vez", que lo niega en silencio):
 * vuelve a pedirlo y, si el sistema ya no muestra el diálogo, abre los ajustes de la app. */
export async function activarAlertasEnSegundoPlano(): Promise<boolean> {
  const primerPlano = await Location.requestForegroundPermissionsAsync();
  const fondo = primerPlano.granted ? await Location.requestBackgroundPermissionsAsync() : primerPlano;
  if (fondo.granted) await actualizarZonasPeligro();
  else if (!fondo.canAskAgain) await Linking.openSettings();
  return fondo.granted;
}

/** Registra como zonas de peligro los incidentes activos más cercanos a la posición actual y, mientras
 * el usuario se mueve, las vuelve a registrar cada REFRESCO_M recorridos (también en segundo plano).
 * No pide permisos: si no hay ubicación en segundo plano, no hace nada. */
export async function actualizarZonasPeligro(): Promise<void> {
  const fondo = await Location.getBackgroundPermissionsAsync();
  if (!fondo.granted) return;

  await asegurarCanalAlertas();
  const posicion = await obtenerPosicionActual();
  // Si esta consulta falla (p. ej. sin red), igual se inicia el seguimiento: la siguiente posición reintenta.
  if (posicion) {
    await registrarZonas(posicion.lat, posicion.lng).catch((err) =>
      console.warn('[alertas] no se pudieron registrar las zonas iniciales:', err),
    );
  }

  // Siempre se vuelve a iniciar: tras cerrar la app a la fuerza o reiniciar el teléfono, la tarea sigue
  // "registrada" (hasStartedLocationUpdatesAsync da true) pero el servicio ya no corre.
  // En Android esto corre como servicio en primer plano: el sistema exige una notificación fija.
  await Location.startLocationUpdatesAsync(TAREA_MOVIMIENTO, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: REFRESCO_M,
    deferredUpdatesDistance: REFRESCO_M,
    pausesUpdatesAutomatically: true,
    foregroundService: {
      notificationTitle: 'Alertas de zonas de peligro activas',
      notificationBody: 'Te avisamos si pasas cerca de un incidente reportado.',
      killServiceOnDestroy: false,
    },
  });
}

async function registrarZonas(lat: number, lng: number): Promise<void> {
  const zonas = (await reportesApi.cercanos(lat, lng, RADIO_BUSQUEDA_M)).slice(0, MAX_ZONAS);
  if (zonas.length === 0) {
    // Dos posiciones casi juntas pueden intentar detenerla a la vez: que ya esté detenida está bien.
    if (await Location.hasStartedGeofencingAsync(TAREA_ZONAS)) await Location.stopGeofencingAsync(TAREA_ZONAS).catch(() => {});
    return;
  }
  const radioM = (await leerRadioAlertaKm()) * 1000;
  // Llamarlo de nuevo reemplaza las regiones de la tarea que ya estaba corriendo.
  await Location.startGeofencingAsync(
    TAREA_ZONAS,
    zonas.map((z) => ({
      identifier: `${z.id}|${z.titulo}`,
      latitude: z.lat,
      longitude: z.lng,
      radius: radioM,
      notifyOnExit: false,
    })),
  );
}

/** Radio de aviso que eligió el usuario en "Alertas y lugares"; 1.5 km si nunca lo cambió. */
export async function leerRadioAlertaKm(): Promise<number> {
  const guardado = Number(await AsyncStorage.getItem(CLAVE_RADIO).catch(() => null));
  return guardado > 0 ? guardado : RADIO_ALERTA_KM_DEFECTO;
}

/** Guarda el radio de aviso (resuelve en cuanto queda escrito) y vuelve a registrar las zonas en
 * segundo plano para que aplique de inmediato. */
export async function guardarRadioAlertaKm(km: number): Promise<void> {
  await AsyncStorage.setItem(CLAVE_RADIO, String(km));
  actualizarZonasPeligro().catch((err) => console.warn('[alertas] no se pudieron actualizar las zonas:', err));
}

/** "800 m" o "1.5 km". */
export const formatoDistancia = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
