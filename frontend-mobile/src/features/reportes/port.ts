import type { CrearReporteRequest, Reporte } from '@/types/api';

export interface ReportesApi {
  listar(): Promise<Reporte[]>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  apoyar(id: string): Promise<void>;
  /** Confirma que un reporte existente sigue ocurriendo (flujo "¿Es el mismo incidente?"):
   * suma una confirmación y, si se manda foto, se agrega al reporte existente. */
  confirmarDuplicado(id: string, imageBase64?: string): Promise<Reporte>;
}
