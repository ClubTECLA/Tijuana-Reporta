/** `GET /centros` (schema `Centro`). */
export interface CentroApi {
  id: string;
  tipo_centro: number;
  nombre: string;
  descripcion: string | null;
  image_path: string | null;
  latitude: number;
  longitude: number;
  capacidad: number | null;
  cantidad: number | null;
  activo: boolean;
  created_at: string;
}

/** `GET /tipos-centro` (schema `TiposCentro`). */
export interface TipoCentroApi {
  id: number;
  nombre: string;
}

/** Un refugio tal como lo pinta la app (Figma 10.2 y Modal - Refugio). */
export interface Refugio {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** URL de la foto de cabecera; `null` si el centro no tiene (el backend aún no la llena). */
  imagenUrl: string | null;
  /** El backend no guarda dirección: `null` hasta resolverla desde las coordenadas. */
  direccion: string | null;
  lat: number;
  lng: number;
  /** Cuánta gente cabe en el refugio (`capacidad` del backend); `null` si no se registró. */
  capacidad: number | null;
  /** Cuánta gente hay ahora (`cantidad` del backend); `null` si no se registró. Ver `espaciosDisponibles`. */
  ocupados: number | null;
}
