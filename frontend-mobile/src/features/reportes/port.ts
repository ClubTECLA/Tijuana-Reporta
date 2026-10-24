import type { IncidenteApi } from './mappers';
import type { Comentario, ComentarioConAutor, CrearReporteRequest, Reporte } from '@/types/api';

export interface ReportesApi {
  /** Catálogo de incidentes (`GET /incidentes`): fuente de categorías, etiquetas y colores. */
  incidentes(): Promise<IncidenteApi[]>;
  /** Reportes activos de Tijuana. `desde` (ISO) filtra en servidor por fecha de creación; `centro` y `radioM`
   * acotan la zona (sin ellos, toda Tijuana). El mock ignora las tres. */
  listar(opciones?: { desde?: string; centro?: { lat: number; lng: number }; radioM?: number }): Promise<Reporte[]>;
  /** Detalle de un reporte: a diferencia de la lista, trae la fecha real, las etiquetas y la foto. */
  detalle(id: string): Promise<Reporte>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  apoyar(id: string): Promise<void>;
  /** Confirma que un reporte existente sigue ocurriendo (flujo "¿Es el mismo incidente?"):
   * suma una confirmación y, si se manda foto, se agrega al reporte existente. */
  confirmarDuplicado(id: string, imageBase64?: string): Promise<Reporte>;
  /** Hilo de comentarios de un reporte, del más antiguo al más reciente. */
  comentarios(id: string): Promise<ComentarioConAutor[]>;
  comentar(id: string, texto: string): Promise<Comentario>;
}
