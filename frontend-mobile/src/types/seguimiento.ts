export type EstadoPaso = 'completado' | 'activo' | 'pendiente';

export interface PasoSeguimiento {
  id: string;
  titulo: string;
  subtitulo: string;
  hora: string;     // "14:21" | "ahora" | "–"
  estado: EstadoPaso;
}
