import { ApiError, ErrorRed } from '@/lib/http';
import { FotoMuyPesadaError } from './comprimir';

/** Mensaje para el usuario cuando falla elegir o reducir la foto en el propio dispositivo. */
export function mensajePrepararFoto(error: unknown): string {
  return error instanceof FotoMuyPesadaError
    ? 'La foto es demasiado pesada aun comprimida. Prueba con otra.'
    : 'No se pudo preparar la foto. Intenta con otra.';
}

/** Mensaje para el usuario según por qué falló `POST /reportes/{id}/multimedia`.
 * No se muestra el texto del servidor: es técnico y no está pensado para quien reporta. */
export function mensajeSubidaFoto(error: unknown): string {
  if (error instanceof ErrorRed) return 'Sin conexión a internet. Revisa tu red e intenta de nuevo.';
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'La foto no tiene un formato válido. Prueba con otra.';
      case 401:
        return 'Tu sesión expiró. Inicia sesión de nuevo para subir la foto.';
      case 404:
        return 'Solo quien creó el reporte puede agregarle una foto.';
      case 409:
        return 'Este reporte ya tiene tu foto.';
      case 413:
        return 'La foto pesa demasiado.';
      case 422:
        return 'La foto tiene dimensiones demasiado grandes.';
      case 503:
        return 'El servicio de fotos no está disponible por ahora. Intenta de nuevo en unos minutos.';
    }
  }
  return 'No se pudo subir la foto. Intenta de nuevo.';
}

/** Vale la pena ofrecer "Reintentar": la causa es pasajera (sin red o servicio caído). Con cualquier
 * otro error, volver a mandar la misma foto fallaría igual. */
export function esFotoReintentable(error: unknown): boolean {
  return error instanceof ErrorRed || (error instanceof ApiError && error.status === 503);
}
