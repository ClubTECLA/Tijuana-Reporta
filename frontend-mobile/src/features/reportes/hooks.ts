import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportesApi } from './api';

export const reportesKeys = {
  all: ['reportes'] as const,
};

export function useReportes() {
  return useQuery({
    queryKey: reportesKeys.all,
    queryFn: () => reportesApi.listar(),
  });
}

export function useCrearReporteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: Parameters<typeof reportesApi.crear>[0]) => reportesApi.crear(req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.all }),
  });
}

export function useApoyarReporte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportesApi.apoyar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.all }),
  });
}
