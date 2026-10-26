import type { CrearReporteRequest } from '@/types/api';
import type { IncidenteApi } from '../mappers';

// Cuerpo de `POST /reportes` (shared/openapi: CrearReporteRequest). `es_oficial` no se manda:
// un ciudadano recibiría 403.
export interface CrearReporteApi {
  incidente_id: number;
  latitude: number;
  longitude: number;
  direccion?: string;
}

const DIRECCION_MAX = 255;

/** La categoría elegida no existe (o ya no está activa) en el catálogo del backend. */
export class CategoriaNoDisponibleError extends Error {
  constructor() {
    super('La categoría elegida ya no está disponible.');
    this.name = 'CategoriaNoDisponibleError';
  }
}

/** Formulario de mobile -> cuerpo del backend. El backend guarda un solo `incidente_id` por reporte,
 * así que se usa la primera categoría; título, etiquetas y foto no forman parte de este endpoint. */
export function cuerpoCrearReporte(req: CrearReporteRequest, catalogo: IncidenteApi[]): CrearReporteApi {
  const incidente = catalogo.find((i) => i.esta_activo && i.nombre === req.categorias[0]);
  if (!incidente) throw new CategoriaNoDisponibleError();
  return {
    incidente_id: incidente.id,
    latitude: req.lat,
    longitude: req.lng,
    ...(req.direccion !== undefined && { direccion: req.direccion.slice(0, DIRECCION_MAX) }),
  };
}
