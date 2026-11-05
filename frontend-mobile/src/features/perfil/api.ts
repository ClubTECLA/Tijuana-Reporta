import { http } from '@/lib/http';

/** GET /auth/me (shared/openapi/schemas/auth/usuario_me_response.yaml). */
export interface UsuarioMeApi {
  id: string;
  email: string;
  username: string;
  rol_name: string;
}

/** Solo lo que "Mis reportes" lee de ReporteResumen. */
export interface ReporteMioApi {
  id: string;
  titulo: string;
  direccion?: string;
  estado_actual: string;
}

/** GET /reportes/{id}: lo que el detalle de "Mis reportes" lee. */
export interface ReporteDetalleMioApi extends ReporteMioApi {
  created_at: string;
  updated_at: string;
  avistamientos: number;
  tags: Array<{ id: number; nombre: string }>;
  multimedia: Array<{ id: number; path: string }>;
}

export const perfilApi = {
  me: () => http<UsuarioMeApi>('/auth/me'),
  /** GET /reportes/me: reportes creados por el usuario autenticado, todos los estados. */
  misReportes: () => http<ReporteMioApi[]>('/reportes/me'),
  detalle: (id: string) => http<ReporteDetalleMioApi>(`/reportes/${id}`),
};