import type { CategoriaReporte, Reporte } from '@/types/api';
import { CATEGORIAS_FILTRO, VENTANA_PERIODO_MS } from './constantes';
import type { CategoriaFiltro, FiltrosMapa } from './types';

const esDelPicker = (categoria: CategoriaReporte): categoria is CategoriaFiltro =>
  (CATEGORIAS_FILTRO as readonly CategoriaReporte[]).includes(categoria);

// Filtra los reportes que el mapa debe dibujar. Pura: `ahora` se inyecta (nunca se lee el reloj
// aquí) y la entrada no se muta. Solo la capa `incidentes` afecta el resultado; `zonasRiesgo` y
// `avisosOficiales` guardan su estado para cuando existan sus pantallas.
export function aplicarFiltros(reportes: Reporte[], filtros: FiltrosMapa, ahora: Date): Reporte[] {
  if (!filtros.capas.incidentes) return [];

  // Límite INCLUSIVO: un reporte exactamente `ventana` ms más viejo que `ahora` todavía entra.
  const desde = ahora.getTime() - VENTANA_PERIODO_MS[filtros.periodo];
  const todasActivas = CATEGORIAS_FILTRO.every((c) => filtros.categorias.includes(c));

  return reportes.filter((reporte) => {
    const creado = new Date(reporte.created_at).getTime();
    // Fecha no interpretable (NaN): dato corrupto, no se puede decir que sea "reciente".
    if (Number.isNaN(creado) || creado < desde) return false;

    const delPicker = reporte.categorias.filter(esDelPicker);
    // Sin categorías del picker (peligro/servicios/otro) no puede coincidir con ninguna activa:
    // solo se muestra mientras las 6 estén activas (regla provisional del spec).
    if (delPicker.length === 0) return todasActivas;
    return delPicker.some((c) => filtros.categorias.includes(c));
  });
}
