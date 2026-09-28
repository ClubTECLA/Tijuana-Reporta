import { create } from 'zustand';

export interface MapaTarget {
  lat: number;
  lng: number;
  nombre: string;
  /** Si viene, además de volar al punto se abre la tarjeta de ese reporte ("Ver reporte"). */
  reporteId?: string;
}

interface MapaTargetState {
  target: MapaTarget | null;
  setTarget: (target: MapaTarget) => void;
  clear: () => void;
}

// Puente entre la pantalla "Buscar dirección" y el mapa: al elegir un
// resultado se guarda aquí, y la Camera del mapa (que vive en otra pantalla
// del stack) reacciona al cambio para volar hasta ese punto.
export const useMapaTargetStore = create<MapaTargetState>((set) => ({
  target: null,
  setTarget: (target) => set({ target }),
  clear: () => set({ target: null }),
}));
