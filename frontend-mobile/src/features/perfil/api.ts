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

export const perfilApi = {
  me: () => http<UsuarioMeApi>('/auth/me'),
  /** GET /reportes/me: reportes creados por el usuario autenticado, todos los estados. */
  misReportes: () => http<ReporteMioApi[]>('/reportes/me'),
};