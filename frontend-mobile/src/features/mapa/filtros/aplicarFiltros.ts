import type { Reporte } from '@/types/api';
import { VENTANA_PERIODO_MS } from './constantes';
import type { FiltrosMapa } from './types';

export function aplicarFiltros(reportes: Reporte[], filtros: FiltrosMapa, ahora: Date): Reporte[] {
  if (!filtros.capas.incidentes) return [];

  const desde = ahora.getTime() - VENTANA_PERIODO_MS[filtros.periodo];
  const { categorias } = filtros;

  return reportes.filter((reporte) => {
    const creado = new Date(reporte.created_at).getTime();
    if (Number.isNaN(creado) || creado < desde) return false;

    // null = todas: entra todo, también 'otro' o un slug que el catálogo aún no trae. Con un
    // subconjunto explícito solo entran los que coinciden (un reporte sin chip, como 'otro', se oculta).
    return categorias === null || reporte.categorias.some((c) => categorias.includes(c));
  });
}
