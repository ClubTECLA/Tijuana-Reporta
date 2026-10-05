import { useSyncExternalStore } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

// `isInternetReachable` vale `null` mientras NetInfo lo comprueba: se cuenta como en línea para
// no mostrar "sin conexión" un instante al abrir la app.
const hayConexion = (estado: NetInfoState) => estado.isConnected !== false && estado.isInternetReachable !== false;

/** Conecta React Query con NetInfo: sin red, las queries se pausan en vez de fallar, y al
 * volver la conexión se recargan solas (`refetchOnReconnect`). Se llama una vez al iniciar. */
export function iniciarDeteccionDeRed(): void {
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((estado) => setOnline(hayConexion(estado))));
}

// Fuera del hook: una función nueva en cada render haría que React volviera a suscribirse.
const suscribir = (alCambiar: () => void) => onlineManager.subscribe(alCambiar);
const estaEnLinea = () => onlineManager.isOnline();

/** `false` mientras el dispositivo no tenga internet. */
export function useEnLinea(): boolean {
  return useSyncExternalStore(suscribir, estaEnLinea);
}
