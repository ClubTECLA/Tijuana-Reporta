import { distanciaMetros } from '@/lib/geo';
import type { CategoriaReporte, Reporte } from '@/types/api';

// Heurística de mock para "¿es el mismo incidente?": cerca en espacio y en
// tiempo, compartiendo al menos una categoría, y todavía vigente (no resuelto).
// El backend real seguramente afina esto por categoría (una inundación deja de
// ser "la misma" más rápido que un socavón), pero sirve para probar el flujo.
const RADIO_DUPLICADO_M = 150;
const VENTANA_DUPLICADO_MS = 6 * 60 * 60 * 1000; // 6 horas

export interface Duplicado {
  reporte: Reporte;
  distanciaM: number;
}

export function buscarDuplicado(
  categorias: CategoriaReporte[],
  lat: number,
  lng: number,
  reportes: Reporte[],
): Duplicado | null {
  const ahora = Date.now();

  const candidatos = reportes
    .filter((r) => r.status !== 'resuelto')
    .filter((r) => r.categorias.some((c) => categorias.includes(c)))
    .filter((r) => ahora - new Date(r.created_at).getTime() <= VENTANA_DUPLICADO_MS)
    .map((reporte) => ({ reporte, distanciaM: distanciaMetros({ lat, lng }, reporte) }))
    .filter(({ distanciaM }) => distanciaM <= RADIO_DUPLICADO_M)
    .sort((a, b) => a.distanciaM - b.distanciaM);

  return candidatos[0] ?? null;
}
