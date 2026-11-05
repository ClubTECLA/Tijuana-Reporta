import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { useEsInvitado } from '@/lib/session';
import { perfilApi, type ReporteMioApi, type UsuarioMeApi } from './api';
import { separarMisReportes } from './misReportes';

export const perfilKeys = {
  me: ['auth', 'me'] as const,
  misReportes: ['reportes', 'me'] as const,
};

const MOCK_ME: UsuarioMeApi = {
  id: 'mock',
  email: 'bruce.cervantes@test.com',
  username: 'bruce_cervantes',
  rol_name: 'ciudadano',
};

const MOCK_MIS_REPORTES: ReporteMioApi[] = [
  { id: '1', titulo: 'Inundación en 3ra y Constitución', direccion: 'Se unió a INC-2471', estado_actual: 'Verificado' },
  { id: '2', titulo: 'Árbol caído en Blvd. Agua Caliente', direccion: 'Hoy 14:33', estado_actual: 'Probable' },
  { id: '3', titulo: 'Socavón en Col. Libertad', direccion: 'Enviando...', estado_actual: 'Pendiente' },
  { id: '4', titulo: 'Drenaje tapado en Col. Obrera', direccion: '28 ago', estado_actual: 'Resuelto' },
  { id: '5', titulo: 'Luz intermitente en Otay', direccion: 'Duplicado de INC-2464', estado_actual: 'Descartado' },
];

/** Usuario de la sesión. Un invitado no tiene token (daría 401), así que no se pide. */
export function useMiPerfil() {
  const esInvitado = useEsInvitado();
  return useQuery({
    queryKey: perfilKeys.me,
    queryFn: () => (env.useMocks ? Promise.resolve(MOCK_ME) : perfilApi.me()),
    enabled: !esInvitado,
  });
}

/** Reportes del usuario (GET /reportes/me), ya separados en activos y cerrados. Un invitado no los pide. */
export function useMisReportes() {
  const esInvitado = useEsInvitado();
  const consulta = useQuery({
    queryKey: perfilKeys.misReportes,
    queryFn: () => (env.useMocks ? Promise.resolve(MOCK_MIS_REPORTES) : perfilApi.misReportes()),
    enabled: !esInvitado,
  });
  const separados = useMemo(() => separarMisReportes(consulta.data ?? []), [consulta.data]);
  return { ...consulta, activos: separados.activos, cerrados: separados.cerrados };
}