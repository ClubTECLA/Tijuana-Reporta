export type Periodo = 'ahora' | '24h' | '7d';

/** Slug de una categoría del catálogo del backend (`incidentes.nombre`); ya no es una lista cerrada. */
export type CategoriaFiltro = string;

export interface FiltrosMapa {
  /** `null` = todas las categorías (también las que el backend agregue después); una lista = solo esas. */
  categorias: CategoriaFiltro[] | null;
  capas: { incidentes: boolean; zonasRiesgo: boolean; avisosOficiales: boolean };
  periodo: Periodo;
}
