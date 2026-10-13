import { create } from 'zustand';
import type { LugarResultado } from './types';

const MAX_RECIENTES = 5;

interface RecientesState {
  lugares: LugarResultado[];
  agregar: (lugar: LugarResultado) => void;
}

// Solo en memoria (dura la sesión de la app). Persistirlo entre reinicios
// requeriría @react-native-async-storage/async-storage, que hoy no está en
// el proyecto — queda como mejora futura, no bloquea la feature.
export const useRecientesStore = create<RecientesState>((set) => ({
  lugares: [],
  agregar: (lugar) =>
    set((state) => ({
      lugares: [lugar, ...state.lugares.filter((l) => l.id !== lugar.id)].slice(0, MAX_RECIENTES),
    })),
}));
