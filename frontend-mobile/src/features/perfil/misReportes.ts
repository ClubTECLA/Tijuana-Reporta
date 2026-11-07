import type { EstadoReporte } from '@/theme/perfilTokens';
import type { Reporte } from '@/types/reporte';
import type { ReporteMioApi } from './api';

/** Estados del backend -> los que sabe pintar StatusBadge. Un estado desconocido cuenta como pendiente. */
export function mapearEstadoMio(estado: string): EstadoReporte {
  switch (estado) {
    case 'Resuelto':
      return 'resuelto';
    case 'Descartado':
      return 'descartado';
    case 'Probable':
    case 'Verificado':
      return 'en_revision';
    default:
      return 'pendiente';
  }
}

export function mapearMiReporte(r: ReporteMioApi): Reporte {
  return {
    id: r.id,
    titulo: r.titulo,
    estado: mapearEstadoMio(r.estado_actual),
    meta: r.direccion ?? 'Sin dirección',
  };
}

/** Resuelto y Descartado son los estados finales del backend: van a "Cerrados". */
export function separarMisReportes(lista: ReporteMioApi[]): { activos: Reporte[]; cerrados: Reporte[] } {
  const reportes = lista.map(mapearMiReporte);
  return {
    activos: reportes.filter((r) => r.estado !== 'resuelto' && r.estado !== 'descartado'),
    cerrados: reportes.filter((r) => r.estado === 'resuelto' || r.estado === 'descartado'),
  };
}