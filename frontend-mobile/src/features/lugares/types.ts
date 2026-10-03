export type TonoLugar = 'peligro' | 'advertencia' | 'neutro';

export interface LugarResultado {
  id: string;
  nombre: string;
  subtitulo: string;
  lat: number;
  lng: number;
  /** Cantidad de reportes activos (no resueltos) cerca de este lugar. */
  activos: number;
  tono: TonoLugar;
}
