import type { PasoSeguimiento } from '@/types/seguimiento';

/**
 * Seguimiento derivado del estado actual: el backend no guarda un historial de pasos.
 * `hora` convierte una fecha ISO en texto ("hace 2 h"); se recibe para mantener esto puro.
 */
export function pasosDeSeguimiento(
  estado: string,
  creado: string,
  actualizado: string,
  hora: (iso: string) => string,
): PasoSeguimiento[] {
  const enviado: PasoSeguimiento = {
    id: 'enviado',
    titulo: 'Reporte enviado',
    subtitulo: 'Recibido por el sistema',
    hora: hora(creado),
    estado: 'completado',
  };

  if (estado === 'Descartado') {
    return [
      enviado,
      { id: 'descartado', titulo: 'Reporte descartado', subtitulo: 'El equipo lo descartó', hora: hora(actualizado), estado: 'completado' },
    ];
  }

  if (estado === 'Resuelto') {
    return [
      enviado,
      { id: 'revision', titulo: 'Revisado por el equipo', subtitulo: 'Ya fue atendido', hora: '–', estado: 'completado' },
      { id: 'resuelto', titulo: 'Resuelto', subtitulo: 'El incidente ya no está activo', hora: hora(actualizado), estado: 'completado' },
    ];
  }

  const enRevision = estado === 'Probable' || estado === 'Verificado';
  return [
    enviado,
    {
      id: 'revision',
      titulo: enRevision ? 'En revisión por el equipo' : 'En espera de revisión',
      subtitulo: enRevision ? 'El equipo lo está revisando' : 'Aún sin revisar',
      hora: enRevision ? hora(actualizado) : '–',
      estado: 'activo',
    },
    { id: 'resuelto', titulo: 'Resuelto', subtitulo: 'Te avisaremos cuando termine', hora: '–', estado: 'pendiente' },
  ];
}