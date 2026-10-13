import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from './env';

/** `null`: todavía no elige (Bienvenida). `invitado`: solo ve el mapa y los reportes. */
export type ModoSesion = 'invitado' | 'usuario';

// El login aún no está conectado al backend: con mocks, terminar el registro o el inicio de
// sesión deja esta sesión de prueba para poder recorrer la app como usuario.
const TOKEN_SIMULADO = 'sesion-simulada';

interface SessionState {
  token: string | null;
  modo: ModoSesion | null;
  setToken: (token: string | null) => void;
  entrarComoInvitado: () => void;
  /** Sin token (mientras no haya auth real) se usa la sesión simulada. */
  iniciarSesion: (token?: string) => void;
  /** Cierra la sesión o sale del modo invitado: vuelve a la Bienvenida. */
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      modo: null,
      setToken: (token) => set({ token }),
      entrarComoInvitado: () => set({ token: null, modo: 'invitado' }),
      iniciarSesion: (token) => {
        const efectivo = token ?? (env.useMocks ? TOKEN_SIMULADO : null);
        if (efectivo !== null) set({ token: efectivo, modo: 'usuario' });
      },
      clear: () => set({ token: null, modo: null }),
    }),
    {
      // Se recuerda entre aperturas: quien ya eligió (invitado o con sesión) entra directo al mapa.
      name: 'sesion',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ token, modo }) => ({ token, modo }),
    },
  ),
);

/** true cuando se puede iniciar sesión sin backend (mocks activos). */
export const puedeSimularSesion = env.useMocks;

/** `false` hasta que la sesión guardada se termina de leer del almacenamiento. */
export function useSesionCargada(): boolean {
  return useSyncExternalStore(suscribirCarga, estaCargada);
}

const suscribirCarga = (alCambiar: () => void) => useSessionStore.persist.onFinishHydration(alCambiar);
const estaCargada = () => useSessionStore.persist.hasHydrated();

/** true salvo con sesión iniciada: el invitado solo puede ver el mapa y los reportes. */
export function useEsInvitado(): boolean {
  return useSessionStore((s) => s.modo !== 'usuario');
}
