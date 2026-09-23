import { http } from '@/lib/http';
import type { Reporte } from '@/types/api';
import type { ReportesApi } from './port';

// Estos endpoints todavía no existen en el backend (hoy solo está
// POST /reportes/:id/comentarios); siguen la convención de shared/openapi.
export const reportesHttp: ReportesApi = {
  listar: () => http<Reporte[]>('/reportes'),
  crear: (req) => http<Reporte>('/reportes', { method: 'POST', body: JSON.stringify(req) }),
  apoyar: (id) => http<void>(`/reportes/${id}/apoyar`, { method: 'POST' }),
};
