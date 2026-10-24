import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFiltrosStore } from '../mapa/filtros/filtrosStore';
import { periodoADesde } from '../mapa/filtros/periodoADesde';
import type { Periodo } from '../mapa/filtros/types';
import { reportesApi } from './api';
import { categoriasORespaldo, type CategoriaUI } from '../categorias/categorias';
import { detalleApiKey } from './claves';

export const reportesKeys = {
  all: ['reportes'] as const,
  lista: (periodo: Periodo) => ['reportes', 'lista', periodo] as const,
};

/** Lista del mapa. El período aplicado entra a la queryKey (cambiarlo vuelve a pedir la lista) y
 * `desde` se calcula al ejecutar la petición, no al renderizar: así la key es estable (un
 * `new Date()` en el render la cambiaría sin parar) y cada refetch usa una ventana al día. */
export function useReportes() {
  const periodo = useFiltrosStore((s) => s.filtros.periodo);
  return useQuery({
    queryKey: reportesKeys.lista(periodo),
    queryFn: () => reportesApi.listar({ desde: periodoADesde(periodo, new Date()) }),
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

/** Consulta el hilo de un reporte cuando su identificador está definido. */
export function useComentarios(reporteId: string | undefined) {
  return useQuery({
    queryKey: comentariosKeys.reporte(reporteId ?? ''),
    queryFn: () => reportesApi.comentarios(reporteId as string),
    enabled: reporteId !== undefined,
  });
}

/** Publica un comentario e invalida la consulta del hilo correspondiente al completarse. */
export function useComentar(reporteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => reportesApi.comentar(reporteId, texto),
    // El hilo sale del detalle crudo en caché (staleTime 5 s): hay que invalidarlo o el refetch no vería el comentario nuevo.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: detalleApiKey(reporteId) });
      await queryClient.invalidateQueries({ queryKey: comentariosKeys.reporte(reporteId) });
    },
  });
}

/** Confirma un reporte existente con foto opcional e invalida la lista al completarse. */
export function useConfirmarDuplicado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageBase64 }: { id: string; imageBase64?: string }) =>
      reportesApi.confirmarDuplicado(id, imageBase64),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reportesKeys.all }),
  });
}

export const detalleKeys = {
  reporte: (id: string) => ['reportes', 'detalle', id] as const,
};

/** Detalle de un reporte (fecha real, etiquetas y foto); la lista no trae foto. */
export function useReporteDetalle(reporteId: string) {
  return useQuery({
    queryKey: detalleKeys.reporte(reporteId),
    queryFn: () => reportesApi.detalle(reporteId),
  });
}

// El catálogo casi no cambia (misma key y staleTime que el cruce de `http.ts`: una sola petición).
const CATALOGO_STALE_MS = 10 * 60_000;

/** Categorías del catálogo del backend (etiqueta y color incluidos). Mientras no carga, o si falla,
 * devuelve el respaldo local para que la hoja de filtros no espere un spinner. */
export function useCategorias(): CategoriaUI[] {
  const { data } = useQuery({
    queryKey: ['incidentes'],
    queryFn: () => reportesApi.incidentes(),
    staleTime: CATALOGO_STALE_MS,
  });
  return useMemo(() => categoriasORespaldo(data), [data]);
}
