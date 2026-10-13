export type TonoLugar = 'peligro' | 'advertencia' | 'neutro';

export interface LugarResultado {
  id: string;
  nombre: string;
  subtitulo: string;
  lat: number;
  lng: number;
  /** Cantidad de reportes activos (no resueltos) cerca de este lugar; `null` si no se pudo saber
   * (sin red y sin lista en caché), que no es lo mismo que cero. */
  activos: number | null;
  tono: TonoLugar;
}
