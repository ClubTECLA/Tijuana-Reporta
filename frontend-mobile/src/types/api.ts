/** Slug de la categoría (`incidentes.nombre` del backend: luz, socavon, incendio…); 'otro' si no se conoce. */
export type CategoriaReporte = string;

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

/** Lo que la tarjeta del reporte necesita pintar (Figma 22). `autor` es "Anónimo" para un ciudadano y el
 * nombre del rol para un rol oficial; nunca el nombre de usuario. */
export interface ComentarioConAutor extends Comentario {
  autor: string;
  es_oficial?: boolean;
}

export interface CrearReporteRequest {
  titulo: string;
  categorias: CategoriaReporte[];
  tags: string[];
  lat: number;
  lng: number;
  direccion?: string;
}
