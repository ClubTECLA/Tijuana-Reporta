import type { CategoriaFiltro, FiltrosMapa, Periodo } from './types';

/** Orden del picker en el Figma. */
export const CATEGORIAS_FILTRO: readonly CategoriaFiltro[] = [
  'inundacion',
  'deslave',
  'drenaje',
  'arbol',
  'socavon',
  'luz',
];

export const FILTROS_POR_DEFECTO: FiltrosMapa = {
  categorias: [...CATEGORIAS_FILTRO],
  capas: { incidentes: true, zonasRiesgo: true, avisosOficiales: true },
  periodo: 'ahora',
};

const HORA_MS = 60 * 60 * 1000;

// SUPUESTO PROVISIONAL: hasta definir las reglas de negocio, "Ahora" = últimas 2 h.
export const VENTANA_PERIODO_MS: Record<Periodo, number> = {
  ahora: 2 * HORA_MS,
  '24h': 24 * HORA_MS,
  '7d': 7 * 24 * HORA_MS,
};
