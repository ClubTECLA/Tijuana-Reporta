import { env } from '@/lib/env';
import { http } from '@/lib/http';
import { refugiosDeCentros } from './mappers';
import type { RefugiosApi } from './port';
import type { CentroApi, TipoCentroApi } from './types';

export const refugiosHttp: RefugiosApi = {
  // `GET /centros` ya devuelve solo los activos. El tipo se resuelve por nombre en el catálogo.
  listar: async () => {
    const [centros, tipos] = await Promise.all([
      http<CentroApi[]>('/centros'),
      http<TipoCentroApi[]>('/tipos-centro'),
    ]);
    return refugiosDeCentros(centros, tipos, env.apiUrl);
  },
};
