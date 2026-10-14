import type { CategoriaReporte } from '@/types/api';

export type Periodo = 'ahora' | '24h' | '7d';

/** Las 6 categorías que ofrece el picker del Figma; `peligro`, `servicios` y `otro` no se filtran. */
export type CategoriaFiltro = Extract<
  CategoriaReporte,
  'inundacion' | 'deslave' | 'drenaje' | 'arbol' | 'socavon' | 'luz'
>;

export interface FiltrosMapa {
  categorias: CategoriaFiltro[];
  capas: { incidentes: boolean; zonasRiesgo: boolean; avisosOficiales: boolean };
  periodo: Periodo;
}
