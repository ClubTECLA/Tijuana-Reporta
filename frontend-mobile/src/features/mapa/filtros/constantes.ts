import type { FiltrosMapa, Periodo } from './types';

export const FILTROS_POR_DEFECTO: FiltrosMapa = {
  categorias: null, // todas, sin depender de la lista (el catálogo llega de forma asíncrona)
  capas: { incidentes: true, zonasRiesgo: true, avisosOficiales: true },
  // 7 días y no "ahora": con datos reales, si no hubo reportes en las últimas 2 h el mapa salía
  // vacío. El store no persiste, así que no hay valores guardados que migrar.
  periodo: '7d',
};

const HORA_MS = 60 * 60 * 1000;

// SUPUESTO PROVISIONAL: hasta definir las reglas de negocio, "Ahora" = últimas 2 h.
export const VENTANA_PERIODO_MS: Record<Periodo, number> = {
  ahora: 2 * HORA_MS,
  '24h': 24 * HORA_MS,
  '7d': 7 * 24 * HORA_MS,
};
