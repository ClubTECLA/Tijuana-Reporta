import type { AvisoReportes } from '@/features/reportes/avisos';
import { mensajeDeError, type EstadoDatos } from '@/lib/estados';

/** Aviso flotante de la capa de refugios según el estado de su consulta; `null` si ya hay refugios. */
export function avisoDeRefugios(estado: EstadoDatos, error?: unknown): AvisoReportes | null {
  switch (estado) {
    case 'cargando':
      return { tipo: 'cargando', mensaje: 'Cargando refugios…' };
    case 'sin-conexion':
      return { tipo: 'sin-conexion', mensaje: 'Sin conexión: no se pueden cargar los refugios', conReintentar: true };
    case 'error':
      return {
        tipo: 'error',
        mensaje: mensajeDeError(error, 'No se pudieron cargar los refugios'),
        conReintentar: true,
      };
    case 'vacio':
      return { tipo: 'info', mensaje: 'Aún no hay refugios registrados' };
    case 'listo':
      return null;
  }
}
