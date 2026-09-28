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

export const comentariosKeys = {
  reporte: (id: string) => ['comentarios', id] as const,
};

export function useComentarios(reporteId: string | undefined) {
  return useQuery({
    queryKey: comentariosKeys.reporte(reporteId ?? ''),
    queryFn: () => reportesApi.comentarios(reporteId as string),
    enabled: reporteId !== undefined,
  });
}

export function useComentar(reporteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => reportesApi.comentar(reporteId, texto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: comentariosKeys.reporte(reporteId) }),
  });
}

export function useConfirmarDuplicado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageBase64 }: { id: string; imageBase64?: string }) =>
      reportesApi.confirmarDuplicado(id, imageBase64),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.all }),
  });
}
