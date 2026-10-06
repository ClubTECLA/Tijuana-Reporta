import type { LugarResultado } from './types';

export interface LugaresApi {
  buscar(query: string): Promise<LugarResultado[]>;
}
