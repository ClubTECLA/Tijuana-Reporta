import { useQuery } from '@tanstack/react-query';
import { lugaresApi } from './api';

/** Consulta lugares con al menos tres caracteres y conserva los resultados frescos durante un minuto. */
export function useLugares(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['lugares', q],
    queryFn: () => lugaresApi.buscar(q),
    enabled: q.length >= 3,
    staleTime: 60_000,
    retry: false,
  });
}
