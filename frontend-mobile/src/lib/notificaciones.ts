import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Canal de Android para las alertas de incidentes cercanos y avisos oficiales.
const CANAL_ALERTAS = 'alertas';

/** Pide permiso para mostrar notificaciones. Devuelve si quedó concedido.
 *
 * En Android 13+ el sistema no muestra el diálogo de permiso hasta que existe al menos un canal,
 * por eso se crea antes de pedirlo. */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ALERTAS, {
      name: 'Alertas cercanas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}
