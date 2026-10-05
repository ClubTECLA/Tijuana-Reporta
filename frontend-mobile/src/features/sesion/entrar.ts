import { router } from 'expo-router';
import { useSessionStore } from '@/lib/session';

/** Inicia sesión y regresa al mapa, ya sea que el login se abrió desde la Bienvenida o desde el
 * mapa como invitado: `dismissTo` vuelve al mapa si está en el historial, o lo abre si no. */
export function iniciarSesionYEntrar(token?: string): void {
  useSessionStore.getState().iniciarSesion(token);
  // Sin sesión el mapa está protegido (app/_layout.tsx): se navega en el siguiente tick, cuando
  // el layout ya se volvió a pintar con la ruta disponible.
  setTimeout(() => router.dismissTo('/(main)'), 0);
}
