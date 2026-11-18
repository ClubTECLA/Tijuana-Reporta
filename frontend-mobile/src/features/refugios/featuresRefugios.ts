import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Refugio } from './types';

/** Lo que la capa del mapa lee de un marcador de refugio (expresiones `['get', ...]`). */
export interface PropiedadesRefugio {
  id: string;
  seleccionado: boolean;
}

/** Refugios -> GeoJSON para la fuente del mapa. El seleccionado va al final: se dibuja encima. */
export function featuresDeRefugios(
  refugios: readonly Refugio[],
  seleccionadoId: string | null,
): FeatureCollection<Point, PropiedadesRefugio> {
  const features = refugios.map(
    (r): Feature<Point, PropiedadesRefugio> => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
      properties: { id: r.id, seleccionado: r.id === seleccionadoId },
    }),
  );
  features.sort((a, b) => Number(a.properties.seleccionado) - Number(b.properties.seleccionado));
  return { type: 'FeatureCollection', features };
}

/** Id del refugio del primer marcador tocado, o null si el toque no cayó sobre uno. */
export function idDeRefugio(features: readonly Feature[]): string | null {
  const id = features[0]?.properties?.id;
  return typeof id === 'string' ? id : null;
}
