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
  zonasActivas,
} from './mappers';
import { rutaCercanos } from './cercanos';
import { detalleApiKey } from './claves';
import { cuerpoCrearReporte } from './crear/cuerpoApi';
import type { ReportesApi } from './port';

// El catálogo casi no cambia: se pide una vez y se cruza por `incidente_id`.
const CATALOGO_STALE_MS = 10 * 60_000;
const catalogo = () =>
  queryClient.fetchQuery({
    queryKey: ['incidentes'],
    queryFn: () => http<IncidenteApi[]>('/incidentes'),
    staleTime: CATALOGO_STALE_MS,
  });

// Para leer reportes el catálogo solo pone la categoría: si su petición falla, se sigue con el que haya en caché
// (o ninguno: las categorías caen en "otro") en vez de perder la lista o el detalle completos.
const catalogoParaLeer = () =>
  catalogo().catch(() => queryClient.getQueryData<IncidenteApi[]>(['incidentes']) ?? []);

// Detalle y comentarios salen del mismo GET /reportes/{id}: comparten caché para no pedirlo dos veces.
const detalleApi = (id: string) =>
  queryClient.fetchQuery({
    queryKey: detalleApiKey(id),
    queryFn: () => http<ReporteApi>(`/reportes/${id}`),
    staleTime: 5_000,
  });

export const reportesHttp: ReportesApi = {
  // Sin `fetchQuery`: `useCategorias` consulta con la misma key ['incidentes'] y anidarlo dejaría la petición esperándose a sí misma.
  incidentes: () => http<IncidenteApi[]>('/incidentes'),
  listar: async ({ desde, centro, radioM } = {}) => {
    const [items, incidentes] = await Promise.all([
      http<ReporteCercanoApi[]>(rutaCercanos(desde, { centro, radioM })),
      catalogoParaLeer(),
    ]);
    const ahora = new Date();
    return items.flatMap((r) => mapearResumen(r, incidentes, ahora) ?? []);
  },
  // Las zonas de peligro salen de la misma lista acotada al punto: así llevan el nombre real del incidente.
  cercanos: async (lat, lng, radioM) => zonasActivas(await reportesHttp.listar({ centro: { lat, lng }, radioM })),
  detalle: async (id) => {
    const [reporte, incidentes] = await Promise.all([detalleApi(id), catalogoParaLeer()]);
    return mapearDetalle(reporte, incidentes, env.apiUrl);
  },
  // Del hilo, el backend entrega `username` y `rol_name` dentro del detalle del reporte.
  comentarios: async (id) => (await detalleApi(id)).comentarios.map(mapearComentario),

  // La respuesta es el reporte completo (201), el mismo que `GET /reportes/{id}`. La foto va aparte
  // (`POST /reportes/{id}/multimedia`, rebanada 2): aquí `image_base64` y las etiquetas no se mandan.
  crear: async (req) => {
    const incidentes = await catalogo();
    const reporte = await http<ReporteApi>('/reportes', {
      method: 'POST',
      body: JSON.stringify(cuerpoCrearReporte(req, incidentes)),
    });
    return mapearDetalle(reporte, incidentes, env.apiUrl);
  },
  // TODO(1b): apoyar y confirmar apuntan a rutas que no existen; el backend usa PATCH /reportes/{id}/avistamientos.
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
