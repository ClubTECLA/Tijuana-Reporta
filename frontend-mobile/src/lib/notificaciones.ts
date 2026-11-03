import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Canal de Android para las alertas de incidentes cercanos y avisos oficiales.
export const CANAL_ALERTAS = 'alertas';

/** Crea el canal de alertas en Android (no hace nada si ya existe). Una notificación enviada a un
 * canal que no existe se descarta sin error, y el permiso pudo darse desde los ajustes del sistema. */
export async function asegurarCanalAlertas(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ALERTAS, {
    name: 'Alertas cercanas',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Pide permiso para mostrar notificaciones. Devuelve si quedó concedido.
 *
 * En Android 13+ el sistema no muestra el diálogo de permiso hasta que existe al menos un canal,
 * por eso se crea antes de pedirlo. */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  await asegurarCanalAlertas();
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}
