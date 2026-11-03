import type { Polygon } from "geojson";

// Grados de latitud por metro: un grado mide ~111,32 km en cualquier latitud.
const METERS_PER_DEGREE = 111_320;
const STEPS = 64;

/**
 * Polígono que aproxima un círculo de `radiusMeters` alrededor de un punto, para dibujar radios reales en el mapa
 * (MapLibre solo dibuja círculos en píxeles). Aproximación equirectangular: de sobra para radios de pocos kilómetros.
 */
export function circlePolygon(longitude: number, latitude: number, radiusMeters: number): Polygon {
    const dLat = radiusMeters / METERS_PER_DEGREE;
    // Los meridianos se juntan hacia los polos: un grado de longitud mide menos que uno de latitud.
    const dLng = dLat / Math.cos((latitude * Math.PI) / 180);
    const ring = Array.from({ length: STEPS }, (_, i) => {
        const angle = (i / STEPS) * 2 * Math.PI;
        return [longitude + dLng * Math.cos(angle), latitude + dLat * Math.sin(angle)];
    });
    // GeoJSON exige que el anillo termine en su primer punto.
    return { type: "Polygon", coordinates: [[...ring, ring[0]]] };
}
