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
  /** Total de espacios; `null` si no se registró. */
  capacidad: number | null;
  /** Espacios disponibles (`cantidad` del backend, según el Figma: "35 de 50"); `null` si no se registró. */
  disponibles: number | null;
}
