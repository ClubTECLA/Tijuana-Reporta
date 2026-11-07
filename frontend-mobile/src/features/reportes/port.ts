import type { IncidenteApi } from './mappers';
import type { Comentario, ComentarioConAutor, CrearReporteRequest, Reporte } from '@/types/api';

/** Incidente activo cerca de un punto: lo mínimo para vigilarlo como zona de peligro. */
export interface ZonaPeligro {
  id: string;
  titulo: string;
  lat: number;
  lng: number;
}

export interface ReportesApi {
  /** Catálogo de incidentes (`GET /incidentes`): fuente de categorías, etiquetas y colores. */
  incidentes(): Promise<IncidenteApi[]>;
  /** Reportes activos de Tijuana. `desde` (ISO) filtra en servidor por fecha de creación; `centro` y `radioM`
   * acotan la zona (sin ellos, toda Tijuana). El mock ignora las tres. */
  listar(opciones?: { desde?: string; centro?: { lat: number; lng: number }; radioM?: number }): Promise<Reporte[]>;
  /** Detalle de un reporte: a diferencia de la lista, trae la fecha real, las etiquetas y la foto. */
  detalle(id: string): Promise<Reporte>;
  /** Reportes activos a menos de `radioM` metros del punto, del más cercano al más lejano. */
  cercanos(lat: number, lng: number, radioM: number): Promise<ZonaPeligro[]>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  /** Sube la foto (JPEG ya reducido) a un reporte y devuelve su URL pública. Solo el creador del
   * reporte puede subirla, una por usuario: por eso va aparte de `crear` y no existe en `confirmarDuplicado`. */
  subirFoto(reporteId: string, uri: string): Promise<string>;
  apoyar(id: string): Promise<void>;
  /** Confirma que un reporte existente sigue ocurriendo (flujo "¿Es el mismo incidente?"):
   * suma una confirmación. No lleva foto: el reporte es de otra persona y el backend solo deja
   * subirla a su creador. */
  confirmarDuplicado(id: string): Promise<Reporte>;
  /** Hilo de comentarios de un reporte, del más antiguo al más reciente. */
  comentarios(id: string): Promise<ComentarioConAutor[]>;
  comentar(id: string, texto: string): Promise<Comentario>;
}
