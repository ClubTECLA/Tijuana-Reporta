import type { CategoriaReporte, ComentarioConAutor, Reporte, StatusReporte } from '@/types/api';

// Forma de las respuestas del backend (shared/openapi). Solo lo que mobile lee.
export interface IncidenteApi {
  id: number;
  nombre: string;
  etiqueta: string;
  tiempo_limite: number;
  radio: number;
  color: string;
  tags: Array<{ id: number; nombre: string; peso: number }>;
  esta_activo: boolean;
}

export interface ReporteResumenApi {
  id: string;
  incidente_id: number;
  titulo: string;
  direccion?: string;
  estado_actual: string;
  avistamientos: number;
  es_oficial: boolean;
  latitude: number;
  longitude: number;
}

// GET /reportes/cercanos: el resumen más la distancia al punto consultado (mobile no la usa).
export interface ReporteCercanoApi extends ReporteResumenApi {
  distancia_m: number;
}

export interface ComentarioApi {
  id: number;
  reporte_id: string;
  user_id: string;
  username?: string;
  rol_name?: string;
  comentario: string;
  created_at: string;
}

export interface ReporteApi extends ReporteResumenApi {
  es_historico: boolean;
  created_at: string;
  updated_at: string;
  comentarios: ComentarioApi[];
  multimedia: Array<{ id: number; path: string; user_id: string; created_at: string }>;
  tags: Array<{ id: number; nombre: string; count: number }>;
  locations: unknown[];
}

// El backend tiene 5 estados y mobile 3: Pendiente y Probable se ven igual (aún sin
// confirmar), Verificado es "en proceso". Descartado no se muestra: devuelve null.
export function mapearEstado(estado: string): StatusReporte | null {
  switch (estado) {
    case 'Pendiente':
    case 'Probable':
      return 'pendiente';
    case 'Verificado':
      return 'en_proceso';
    case 'Resuelto':
      return 'resuelto';
    default:
      return null;
  }
}

// La categoría es el `incidentes.nombre` (slug) del backend, sea cual sea. Solo un incidente
// ausente del catálogo cae en 'otro'; etiqueta y color se resuelven aparte (`resolverCategoria`).
export function categoriaDeIncidente(incidente: IncidenteApi | undefined): CategoriaReporte {
  return incidente?.nombre ?? 'otro';
}

// Roles de la tabla `roles`: ciudadano, admin, moderador, analista, proteccion_civil, rescatista.
// Se destaca como "Rescatista" a quien atiende en campo: rescatista y protección civil.
const ROLES_RESCATISTA = ['rescatista', 'proteccion_civil'];

export const esRescatista = (rolName: string | undefined): boolean =>
  rolName !== undefined && ROLES_RESCATISTA.includes(rolName);

/** Esquema + host (+ puerto) de la API, sin ruta: `http://10.0.2.2/api/v1` -> `http://10.0.2.2`. */
export function origenDeApi(apiUrl: string): string {
  const coincide = /^(https?:\/\/[^/]+)/.exec(apiUrl);
  return coincide ? coincide[1] : apiUrl;
}

/** Las fotos las sirve nginx en `/multimedia/{path}`, fuera del prefijo `/api`. */
export const urlMultimedia = (path: string, apiUrl: string): string =>
  `${origenDeApi(apiUrl)}/multimedia/${path.replace(/^\/+/, '')}`;

const buscarIncidente = (catalogo: IncidenteApi[], id: number) => catalogo.find((i) => i.id === id);

// `user_id` no viene en el backend y ninguna pantalla lo lee: se deja vacío.
function baseReporte(r: ReporteResumenApi, catalogo: IncidenteApi[]) {
  return {
    id: r.id,
    titulo: r.titulo,
    categorias: [categoriaDeIncidente(buscarIncidente(catalogo, r.incidente_id))],
    lat: r.latitude,
    lng: r.longitude,
    direccion: r.direccion,
    upvotes: r.avistamientos,
    user_id: '',
  };
}

/** Resumen de la lista (también `ReporteCercano`, que solo suma `distancia_m`) -> `Reporte`; `null` si
 * está Descartado. No trae fecha ni foto: `created_at` es `ahora` de respaldo (el período ya lo filtró
 * el servidor con `desde`, así que el filtro de período del cliente no los oculta) y sin `image_url`. */
export function mapearResumen(r: ReporteResumenApi, catalogo: IncidenteApi[], ahora: Date): Reporte | null {
  const status = mapearEstado(r.estado_actual);
  if (status === null) return null;
  return { ...baseReporte(r, catalogo), tags: [], image_url: undefined, status, created_at: ahora.toISOString() };
}

export function mapearComentario(c: ComentarioApi): ComentarioConAutor {
  return {
    id: c.id,
    reporte_id: c.reporte_id,
    user_id: c.user_id,
    autor: c.username ?? 'Anónimo',
    es_rescatista: esRescatista(c.rol_name),
    comentario: c.comentario,
    created_at: c.created_at,
  };
}

/** Detalle -> `Reporte` con fecha real, tags y la primera foto. Un Descartado (solo se llega por
 * id directo; la lista lo excluye) se muestra como pendiente. */
export function mapearDetalle(r: ReporteApi, catalogo: IncidenteApi[], apiUrl: string): Reporte {
  const foto = r.multimedia[0];
  return {
    ...baseReporte(r, catalogo),
    tags: r.tags.map((t) => t.nombre),
    image_url: foto ? urlMultimedia(foto.path, apiUrl) : undefined,
    status: mapearEstado(r.estado_actual) ?? 'pendiente',
    created_at: r.created_at,
  };
}
