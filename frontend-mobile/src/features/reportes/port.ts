import type { Comentario, ComentarioConAutor, CrearReporteRequest, Reporte } from '@/types/api';

export interface ReportesApi {
  listar(): Promise<Reporte[]>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  apoyar(id: string): Promise<void>;
  /** Confirma que un reporte existente sigue ocurriendo (flujo "¿Es el mismo incidente?"):
   * suma una confirmación y, si se manda foto, se agrega al reporte existente. */
  confirmarDuplicado(id: string, imageBase64?: string): Promise<Reporte>;
  /** Hilo de comentarios de un reporte, del más antiguo al más reciente. */
  comentarios(id: string): Promise<ComentarioConAutor[]>;
  comentar(id: string, texto: string): Promise<Comentario>;
}
