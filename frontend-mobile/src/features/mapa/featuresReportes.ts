import type { Feature, FeatureCollection, Point } from 'geojson';
import { resolverCategoria, type CategoriaUI } from '@/features/categorias/categorias';
import type { Reporte } from '@/types/api';
import { textoConfirmaciones } from './insignia';

/** Lo que cada capa del mapa lee de un pin (expresiones `['get', ...]`). */
export interface PropiedadesPin {
  id: string;
  /** Color del backend, '#RRGGBB'. */
  color: string;
  /** Nombre de la imagen registrada en el mapa (slug del catálogo, o 'generico'). */
  icono: string;
  /** Confirmaciones ya formateadas ('99+' desde 100); las capas de texto solo aceptan strings. */
  confirmaciones: string;
  seleccionado: boolean;
}

export type FeaturePin = Feature<Point, PropiedadesPin>;

/** Reportes -> GeoJSON de pins para la fuente del mapa. El seleccionado va al final: se dibuja encima. */
export function featuresDeReportes(
  reportes: readonly Reporte[],
  catalogo: readonly CategoriaUI[],
  seleccionadoId: string | null,
): FeatureCollection<Point, PropiedadesPin> {
  const features = reportes.map((r): FeaturePin => {
    const { color, icono } = resolverCategoria(r.categorias[0], catalogo);
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: {
        id: r.id,
        color,
        icono,
        confirmaciones: textoConfirmaciones(r.upvotes),
        seleccionado: r.id === seleccionadoId,
      },
    };
  });
  features.sort((a, b) => Number(a.properties.seleccionado) - Number(b.properties.seleccionado));
  return { type: 'FeatureCollection', features };
}

/** Id del reporte del primer pin tocado, o null si el toque no cayó sobre un pin. */
export function idDeFeature(features: readonly Feature[]): string | null {
  const id = features[0]?.properties?.id;
  return typeof id === 'string' ? id : null;
}

/** Si el primer feature tocado es un grupo de pins (cluster), su id y su centro [lng, lat]; si no, null. */
export function clusterDeFeature(features: readonly Feature[]): { clusterId: number; centro: [number, number] } | null {
  const f = features[0];
  const clusterId = f?.properties?.cluster_id;
  if (f?.geometry.type !== 'Point' || typeof clusterId !== 'number') return null;
  const [lng, lat] = f.geometry.coordinates;
  return { clusterId, centro: [lng, lat] };
}
