import { create } from 'zustand';
import { FILTROS_POR_DEFECTO } from './constantes';
import type { FiltrosMapa } from './types';

interface FiltrosState {
  filtros: FiltrosMapa;
  aplicar: (filtros: FiltrosMapa) => void;
  reiniciar: () => void;
}

// Copia profunda a mano: el store nunca comparte arrays/objetos con quien lo llama
// ni con FILTROS_POR_DEFECTO, así que mutar uno no altera al otro.
const copiar = (f: FiltrosMapa): FiltrosMapa => ({
  categorias: [...f.categorias],
  capas: { ...f.capas },
  periodo: f.periodo,
});

// Filtros APLICADOS al mapa. El borrador de la hoja vive en estado local de la hoja y solo
// llega aquí con `aplicar`; `reiniciar` vuelve a FILTROS_POR_DEFECTO.
export const useFiltrosStore = create<FiltrosState>((set) => ({
  filtros: copiar(FILTROS_POR_DEFECTO),
  aplicar: (filtros) => set({ filtros: copiar(filtros) }),
  reiniciar: () => set({ filtros: copiar(FILTROS_POR_DEFECTO) }),
}));
