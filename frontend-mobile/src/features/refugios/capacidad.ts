import type { Refugio } from './types';

/**
 * Espacios libres del refugio: lo que cabe menos la gente que hay ("35 de 50" en el Figma). `null` si falta
 * alguno de los dos datos, porque entonces no se puede saber. Nunca baja de 0 aunque `ocupados` pase de la capacidad.
 */
export function espaciosDisponibles({ capacidad, ocupados }: Pick<Refugio, 'capacidad' | 'ocupados'>): number | null {
  if (capacidad === null || ocupados === null) return null;
  return Math.max(0, capacidad - ocupados);
}
