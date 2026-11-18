/**
 * Qué capas muestra el mapa. El botón de la carpa recorre los tres estados en orden:
 * `incidentes` (por defecto) → `ambos` → `refugios` (Figma 10.2) → `incidentes`.
 */
export type CapasMapa = 'incidentes' | 'ambos' | 'refugios';

export const CAPAS_POR_DEFECTO: CapasMapa = 'incidentes';

const SIGUIENTE: Record<CapasMapa, CapasMapa> = {
  incidentes: 'ambos',
  ambos: 'refugios',
  refugios: 'incidentes',
};

/** Estado al que pasa el mapa con el siguiente toque del botón. */
export const siguienteCapas = (actual: CapasMapa): CapasMapa => SIGUIENTE[actual];

export const muestraIncidentes = (capas: CapasMapa): boolean => capas !== 'refugios';

export const muestraRefugios = (capas: CapasMapa): boolean => capas !== 'incidentes';
