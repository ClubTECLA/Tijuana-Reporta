import { QueryClient } from '@tanstack/react-query';
import { iniciarDeteccionDeRed } from './red';

iniciarDeteccionDeRed();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      // Sin red, una mutación en modo 'online' se queda pausada (y su botón cargando) hasta que
      // vuelva la conexión. Así falla de inmediato con `ErrorRed` y la pantalla lo puede explicar.
      networkMode: 'always',
    },
  },
});
