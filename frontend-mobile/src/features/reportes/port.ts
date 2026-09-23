import type { CrearReporteRequest, Reporte } from '@/types/api';

export interface ReportesApi {
  listar(): Promise<Reporte[]>;
  crear(req: CrearReporteRequest): Promise<Reporte>;
  apoyar(id: string): Promise<void>;
}
