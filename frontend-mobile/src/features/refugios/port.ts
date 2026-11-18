import type { Refugio } from './types';

export interface RefugiosApi {
  /** Refugios activos de Tijuana (`GET /centro` filtrado por el tipo "Refugios"). */
  listar(): Promise<Refugio[]>;
}
