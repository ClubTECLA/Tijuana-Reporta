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
  categoria: CategoriaReporte;
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

export interface CrearReporteRequest {
  titulo: string;
  categoria: CategoriaReporte;
  tags: string[];
  lat: number;
  lng: number;
  direccion?: string;
  image_base64?: string;
}
