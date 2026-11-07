import type { CrearReporteRequest, Reporte } from '@/types/api';
import type { ReportesApi } from '../port';
import { esFotoReintentable, mensajeSubidaFoto } from './errores';

/** Por qué no se pudo subir la foto de un reporte que sí se creó. */
export interface ErrorFoto {
  mensaje: string;
  /** La causa es pasajera (sin red, servicio caído): reintentar con la misma foto puede funcionar. */
  reintentable: boolean;
}

export interface ResultadoCreacion {
  reporte: Reporte;
  /** `null` si todo salió bien o no había foto. */
  errorFoto: ErrorFoto | null;
}

/**
 * Crea el reporte y, si hay foto, la sube a él. El orden lo impone el backend: la foto solo la puede
 * subir el creador de un reporte que ya existe. Si la foto falla el reporte NO se pierde: se devuelve
 * junto con el motivo para poder reintentar la foto sin duplicar el reporte.
 */
export async function crearConFoto(
  api: Pick<ReportesApi, 'crear' | 'subirFoto'>,
  req: CrearReporteRequest,
  fotoUri: string | null,
): Promise<ResultadoCreacion> {
  const reporte = await api.crear(req);
  if (fotoUri === null) return { reporte, errorFoto: null };
  try {
    const imageUrl = await api.subirFoto(reporte.id, fotoUri);
    return { reporte: { ...reporte, image_url: imageUrl }, errorFoto: null };
  } catch (error) {
    return { reporte, errorFoto: { mensaje: mensajeSubidaFoto(error), reintentable: esFotoReintentable(error) } };
  }
}
