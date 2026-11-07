import { http } from '@/lib/http';

/** GET /auth/me (shared/openapi/schemas/auth/usuario_me_response.yaml). */
export interface UsuarioMeApi {
  id: string;
  email: string;
  username: string;
  rol_name: string;
}

export const perfilApi = {
  me: () => http<UsuarioMeApi>('/auth/me'),
};