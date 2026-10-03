export type CategoriaReporte =
  | 'socavon'
  | 'peligro'
  | 'drenaje'
  | 'luz'
  | 'deslave'
  | 'arbol'
  | 'inundacion'
  | 'servicios'
  | 'otro';

export type StatusReporte = 'pendiente' | 'en_proceso' | 'resuelto';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
}

export interface Reporte {
  id: string;
  titulo: string;
  /** Un reporte puede describir varios eventos a la vez (p. ej. inundación + árbol caído). */
  categorias: CategoriaReporte[];
  tags: string[];
  lat: number;
  lng: number;
  direccion?: string;
  image_url?: string;
  status: StatusReporte;
  upvotes: number;
  user_id: string;
  created_at: string;
}

export interface Comentario {
  id: number;
  reporte_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
}

/** Lo que la tarjeta del reporte necesita pintar: el contrato solo trae `user_id`, no el nombre
 * del autor ni si es rescatista (Figma 22). Hasta que el backend lo incluya, lo arma el mock. */
export interface ComentarioConAutor extends Comentario {
  autor: string;
  es_rescatista?: boolean;
}

export interface CrearReporteRequest {
  titulo: string;
  categorias: CategoriaReporte[];
  tags: string[];
  lat: number;
  lng: number;
  direccion?: string;
  image_base64?: string;
}
