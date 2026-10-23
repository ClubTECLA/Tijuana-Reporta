import { env } from '@/lib/env';
import { http } from '@/lib/http';
import { queryClient } from '@/lib/query-client';
import type { Comentario, Reporte } from '@/types/api';
import {
  mapearComentario,
  mapearDetalle,
  mapearResumen,
  type IncidenteApi,
  type ReporteApi,
  type ReporteCercanoApi,
} from './mappers';
import { rutaCercanos } from './cercanos';
import type { ReportesApi } from './port';

// El catálogo casi no cambia: se pide una vez y se cruza por `incidente_id`.
const CATALOGO_STALE_MS = 10 * 60_000;
const catalogo = () =>
  queryClient.fetchQuery({
    queryKey: ['incidentes'],
    queryFn: () => http<IncidenteApi[]>('/incidentes'),
    staleTime: CATALOGO_STALE_MS,
  });

// Detalle y comentarios salen del mismo GET /reportes/{id}: comparten caché para no pedirlo dos veces.
const detalleApi = (id: string) =>
  queryClient.fetchQuery({
    queryKey: ['reportes', 'detalle-api', id],
    queryFn: () => http<ReporteApi>(`/reportes/${id}`),
    staleTime: 5_000,
  });

export const reportesHttp: ReportesApi = {
  // Sin `fetchQuery`: `useCategorias` consulta con la misma key ['incidentes'] y anidarlo dejaría la petición esperándose a sí misma.
  incidentes: () => http<IncidenteApi[]>('/incidentes'),
  listar: async ({ desde } = {}) => {
    const [items, incidentes] = await Promise.all([http<ReporteCercanoApi[]>(rutaCercanos(desde)), catalogo()]);
    const ahora = new Date();
    return items.flatMap((r) => mapearResumen(r, incidentes, ahora) ?? []);
  },
  detalle: async (id) => {
    const [reporte, incidentes] = await Promise.all([detalleApi(id), catalogo()]);
    return mapearDetalle(reporte, incidentes, env.apiUrl);
  },
  // Del hilo, el backend entrega `username` y `rol_name` dentro del detalle del reporte.
  comentarios: async (id) => (await detalleApi(id)).comentarios.map(mapearComentario),

  // TODO(1b): escrituras fuera de la entrega de solo lectura; estas rutas aún no existen en el backend
  // (shared/openapi define POST /reportes con otro cuerpo y no hay apoyar/confirmar).
  crear: (req) => http<Reporte>('/reportes', { method: 'POST', body: JSON.stringify(req) }),
  apoyar: (id) => http<void>(`/reportes/${id}/apoyar`, { method: 'POST' }),
  confirmarDuplicado: (id, imageBase64) =>
    http<Reporte>(`/reportes/${id}/confirmar`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),
  // TODO(1b): el POST de comentarios existe; falta ajustar la respuesta al tipo `Comentario`.
  comentar: (id, texto) =>
    http<Comentario>(`/reportes/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ comentario: texto }),
    }),
};
