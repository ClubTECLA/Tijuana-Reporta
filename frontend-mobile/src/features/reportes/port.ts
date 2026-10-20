import type { Comentario, ComentarioConAutor, CrearReporteRequest, Reporte } from '@/types/api';

/** Incidente activo cerca de un punto: lo mínimo para vigilarlo como zona de peligro. */
export interface ZonaPeligro {
  id: string;
  titulo: string;
  lat: number;
  lng: number;
}

export interface ReportesApi {
  listar(): Promise<Reporte[]>;
  /** Reportes activos a menos de `radioM` metros del punto, del más cercano al más lejano. */
  cercanos(lat: number, lng: number, radioM: number): Promise<ZonaPeligro[]>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  apoyar(id: string): Promise<void>;
  /** Confirma que un reporte existente sigue ocurriendo (flujo "¿Es el mismo incidente?"):
   * suma una confirmación y, si se manda foto, se agrega al reporte existente. */
  confirmarDuplicado(id: string, imageBase64?: string): Promise<Reporte>;
  /** Hilo de comentarios de un reporte, del más antiguo al más reciente. */
  comentarios(id: string): Promise<ComentarioConAutor[]>;
  comentar(id: string, texto: string): Promise<Comentario>;
}
