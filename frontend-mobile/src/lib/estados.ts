import { onlineManager, type UseQueryResult } from '@tanstack/react-query';
import { ErrorRed } from './http';

export type EstadoDatos = 'cargando' | 'sin-conexion' | 'error' | 'vacio' | 'listo';

export const esErrorDeRed = (error: unknown): boolean => error instanceof ErrorRed;

/** Qué pintar para una query que todavía no tiene datos, o si los que tiene están vacíos.
 *
 * Una query sin red no falla: React Query la pausa (`fetchStatus: 'paused'`) hasta que vuelva la
 * conexión, así que sin esto se vería cargando para siempre. Si ya hay datos (aunque una recarga
 * haya fallado) se muestran: el aviso de error o sin conexión lo decide cada pantalla. */
export function estadoDeQuery<T>(
  query: Pick<UseQueryResult<T>, 'data' | 'status' | 'fetchStatus' | 'error'>,
  esVacio: (data: T) => boolean,
): EstadoDatos {
  if (query.data !== undefined) return esVacio(query.data) ? 'vacio' : 'listo';
  // `ErrorRed` también cubre servidor caído o tiempo agotado: solo es "sin conexión" si el
  // dispositivo de verdad está desconectado.
  if (query.status === 'error') {
    return esErrorDeRed(query.error) && !onlineManager.isOnline() ? 'sin-conexion' : 'error';
  }
  if (query.fetchStatus === 'paused') return 'sin-conexion';
  return 'cargando';
}

/** Mensaje para el usuario según el tipo de error: sin conexión o un fallo del servidor. */
export function mensajeDeError(error: unknown, siFallaElServidor: string): string {
  return esErrorDeRed(error) ? 'Sin conexión a internet. Revisa tu red e intenta de nuevo.' : siFallaElServidor;
}
