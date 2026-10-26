import { VENTANA_PERIODO_MS } from './constantes';
import type { Periodo } from './types';

// Período del filtro -> parámetro `desde` de GET /reportes/cercanos (ISO). `undefined` = sin
// límite inferior. Pura: `ahora` se inyecta (nunca se lee el reloj aquí).
export function periodoADesde(periodo: Periodo | undefined, ahora: Date): string | undefined {
  if (periodo === undefined) return undefined;
  return new Date(ahora.getTime() - VENTANA_PERIODO_MS[periodo]).toISOString();
}
