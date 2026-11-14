import { useQuery } from '@tanstack/react-query';
import { refugiosApi } from './api';
import { direccionDeCoordenadas } from './direccion';
import type { Refugio } from './types';

export const refugiosKeys = {
  all: ['refugios'] as const,
  direccion: (id: string) => ['refugios', 'direccion', id] as const,
};

const REFUGIOS_STALE_MS = 60_000;

/** Refugios del mapa. Solo se piden con la capa de refugios encendida (`habilitado`): mientras esté
 * apagada no hace falta tocar `/centros`. */
export function useRefugios(habilitado: boolean) {
  return useQuery({
    queryKey: refugiosKeys.all,
    queryFn: () => refugiosApi.listar(),
    enabled: habilitado,
    staleTime: REFUGIOS_STALE_MS,
  });
}

/** Dirección para mostrar: la del refugio si ya la trae (mocks) y, si no, la que resuelve Nominatim desde sus
 * coordenadas. Devuelve `undefined` mientras carga y `null` si no se pudo resolver (se muestran las coordenadas). */
export function useDireccionRefugio(refugio: Refugio): string | null | undefined {
  const { data, isError } = useQuery({
    queryKey: refugiosKeys.direccion(refugio.id),
    queryFn: () => direccionDeCoordenadas(refugio.lat, refugio.lng),
    enabled: refugio.direccion === null,
    staleTime: Infinity,
    retry: false,
  });
  if (refugio.direccion !== null) return refugio.direccion;
  return isError ? null : data;
}
