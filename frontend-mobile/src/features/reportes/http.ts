import { http } from '@/lib/http';
import type { Comentario, ComentarioConAutor, Reporte } from '@/types/api';
import type { ReportesApi } from './port';

// Estos endpoints todavía no existen en el backend (hoy solo está
// POST /reportes/:id/comentarios); siguen la convención de shared/openapi.
export const reportesHttp: ReportesApi = {
  listar: () => http<Reporte[]>('/reportes'),
  crear: (req) => http<Reporte>('/reportes', { method: 'POST', body: JSON.stringify(req) }),
  apoyar: (id) => http<void>(`/reportes/${id}/apoyar`, { method: 'POST' }),
  // Tampoco existe todavía en el contrato: falta definir el endpoint de
  // "confirmar duplicado" (sumar confirmación + adjuntar foto a un reporte existente).
  confirmarDuplicado: (id, imageBase64) =>
    http<Reporte>(`/reportes/${id}/confirmar`, {
      method: 'POST',
      body: JSON.stringify({ image_base64: imageBase64 }),
    }),
  // El contrato solo define POST; falta el GET del hilo, y que cada comentario incluya
  // el nombre del autor y si es rescatista (hoy solo trae `user_id`). Mientras tanto no se
  // promete un `autor` que la respuesta no trae: si falta, se muestra "Anónimo".
  comentarios: async (id) => {
    const hilo = await http<Array<Comentario & Partial<Pick<ComentarioConAutor, 'autor' | 'es_rescatista'>>>>(
      `/reportes/${id}/comentarios`,
    );
    return hilo.map((c): ComentarioConAutor => ({ ...c, autor: c.autor ?? 'Anónimo' }));
  },
  comentar: (id, texto) =>
    http<Comentario>(`/reportes/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ comentario: texto }),
    }),
};
