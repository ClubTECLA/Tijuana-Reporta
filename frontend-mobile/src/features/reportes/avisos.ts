import { VENTANA_PERIODO_MS } from '../mapa/filtros/constantes';
import type { Periodo } from '../mapa/filtros/types';

export interface AccionAviso {
  texto: string;
  tipo: 'ampliar-periodo';
}

export interface AvisoReportes {
  tipo: 'cargando' | 'sin-conexion' | 'error' | 'info';
  mensaje: string;
  conReintentar?: boolean;
  accion?: AccionAviso;
}

export interface EntradaAviso {
  hayDatos: boolean;
  /** Llegó la lista y no trae ningún reporte (del período aplicado). */
  vacia: boolean;
  isError: boolean;
  /** El error es de red (`ErrorRed`); se recibe ya resuelto para mantener esta función pura. */
  errorDeRed: boolean;
  enLinea: boolean;
  /** Período APLICADO (el de la query), no el borrador de la hoja. */
  periodo: Periodo;
  /** Hay reportes, pero los filtros locales los dejan todos fuera. */
  sinCoincidencias: boolean;
}

/** El período más amplio: ahí ya no hay a dónde ampliar. */
export const PERIODO_MAS_AMPLIO: Periodo = '7d';

const HORA_MS = 60 * 60 * 1000;
// La ventana sale de VENTANA_PERIODO_MS para que el texto nunca se desfase de lo que se pide.
const horasDe = (periodo: Periodo) => `${VENTANA_PERIODO_MS[periodo] / HORA_MS} h`;

// Qué decir sobre los reportes del mapa. El mapa nunca se tapa: si ya hay reportes cargados se
// siguen mostrando aunque falle una recarga o se pierda la conexión.
export function avisoDeReportes(e: EntradaAviso): AvisoReportes | null {
  if (!e.enLinea) {
    return {
      tipo: 'sin-conexion',
      mensaje: e.hayDatos ? 'Sin conexión · mostrando los últimos reportes' : 'Sin conexión · los reportes se cargarán al reconectar',
    };
  }
  if (e.isError) {
    const motivo = e.errorDeRed ? 'No pudimos conectar con el servidor' : 'No pudimos cargar los reportes';
    return { tipo: 'error', mensaje: e.hayDatos ? 'No se pudieron actualizar los reportes' : motivo, conReintentar: true };
  }
  if (!e.hayDatos) return { tipo: 'cargando', mensaje: 'Cargando reportes…' };
  if (e.vacia) {
    if (e.periodo === PERIODO_MAS_AMPLIO) return { tipo: 'info', mensaje: 'Aún no hay reportes en la ciudad' };
    return {
      tipo: 'info',
      mensaje: `Sin reportes en las últimas ${horasDe(e.periodo)}`,
      accion: { texto: 'Ver últimos 7 días', tipo: 'ampliar-periodo' },
    };
  }
  if (e.sinCoincidencias) return { tipo: 'info', mensaje: 'Ningún reporte coincide con tus filtros' };
  return null;
}
