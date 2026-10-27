import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { useEsInvitado } from '@/lib/session';
import { perfilApi, type UsuarioMeApi } from './api';

export const perfilKeys = { me: ['auth', 'me'] as const };

const MOCK_ME: UsuarioMeApi = {
  id: 'mock',
  email: 'bruce.cervantes@test.com',
  username: 'bruce_cervantes',
  rol_name: 'ciudadano',
};

/** Usuario de la sesión. Un invitado no tiene token (daría 401), así que no se pide. */
export function useMiPerfil() {
  const esInvitado = useEsInvitado();
  return useQuery({
    queryKey: perfilKeys.me,
    queryFn: () => (env.useMocks ? Promise.resolve(MOCK_ME) : perfilApi.me()),
    enabled: !esInvitado,
  });
}