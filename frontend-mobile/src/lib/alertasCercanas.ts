import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { reportesApi } from '@/features/reportes/api';
import { asegurarCanalAlertas, CANAL_ALERTAS } from '@/lib/notificaciones';
import { registrarAlerta, type RegistroAlertas } from '@/lib/limiteAlertas';
import { obtenerPosicionActual } from '@/lib/ubicacion';

const TAREA_ZONAS = 'zonas-peligro';
const CLAVE_REGISTRO = 'alertas:avisadas-hoy';
// Se buscan incidentes en este radio y se vigila un círculo de RADIO_ZONA_M alrededor de cada uno.
const RADIO_BUSQUEDA_M = 5000;
const RADIO_ZONA_M = 200;
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
      body: `${titulo} a menos de ${RADIO_ZONA_M} m. Toma precauciones.`,
    },
    trigger: { channelId: CANAL_ALERTAS },
  });
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

/** Registra como zonas de peligro los incidentes activos más cercanos a la posición actual.
 * No pide permisos: si no hay ubicación en segundo plano, no hace nada.
 *
 * shortcut: las zonas se refrescan solo al abrir la app; si el usuario se aleja más de
 * RADIO_BUSQUEDA_M sin abrirla, no se vigilan los incidentes de la nueva zona. Mejorar con
 * actualizaciones de ubicación en segundo plano (Location.startLocationUpdatesAsync). */
export async function actualizarZonasPeligro(): Promise<void> {
  const fondo = await Location.getBackgroundPermissionsAsync();
  if (!fondo.granted) return;

  await asegurarCanalAlertas();
  const posicion = await obtenerPosicionActual();
  if (!posicion) return;

  const zonas = (await reportesApi.cercanos(posicion.lat, posicion.lng, RADIO_BUSQUEDA_M)).slice(0, MAX_ZONAS);
  if (zonas.length === 0) {
    if (await Location.hasStartedGeofencingAsync(TAREA_ZONAS)) await Location.stopGeofencingAsync(TAREA_ZONAS);
    return;
  }
  // Llamarlo de nuevo reemplaza las regiones de la tarea que ya estaba corriendo.
  await Location.startGeofencingAsync(
    TAREA_ZONAS,
    zonas.map((z) => ({
      identifier: `${z.id}|${z.titulo}`,
      latitude: z.lat,
      longitude: z.lng,
      radius: RADIO_ZONA_M,
      notifyOnExit: false,
    })),
  );
}
