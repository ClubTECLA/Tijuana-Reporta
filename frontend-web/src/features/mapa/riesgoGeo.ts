import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { ApiMapaCalor, ApiZonaRiesgo } from "@/types/api-types";
import { NIVEL_COLORS } from "@/features/riesgo/riesgo";
import { circlePolygon } from "./circlePolygon";

// Conversión de los datos del riesgo a GeoJSON para la capa del mapa (RiesgoLayer). Funciones puras para probarlas.

/** Celdas del calor como puntos; `w` es su peso normalizado (0 a 1), que usa el heatmap. */
export function celdasGeoJSON(mapa: ApiMapaCalor | null): FeatureCollection<Point> {
    const max = mapa?.peso_maximo ?? 0;
    return {
        type: "FeatureCollection",
        features: (mapa?.celdas ?? []).map((celda) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [celda.longitude, celda.latitude] },
            properties: { w: max > 0 ? celda.peso / max : 0 },
        })),
    };
}

/** Zonas como círculos de su radio real en metros, con el color de su nivel. */
export function zonasGeoJSON(zonas: ApiZonaRiesgo[]): FeatureCollection<Polygon> {
    return {
        type: "FeatureCollection",
        features: zonas.map((zona, index): Feature<Polygon> => ({
            type: "Feature",
            id: index,
            geometry: circlePolygon(zona.longitude, zona.latitude, zona.radio_m),
            properties: { color: NIVEL_COLORS[zona.nivel] },
        })),
    };
}

/** Caja [[oeste, sur], [este, norte]] que contiene el círculo de la zona, para centrarla con fitBounds. */
export function zonaBounds(zona: ApiZonaRiesgo): [[number, number], [number, number]] {
    const ring = circlePolygon(zona.longitude, zona.latitude, zona.radio_m).coordinates[0];
    const lngs = ring.map(([lng]) => lng);
    const lats = ring.map(([, lat]) => lat);
    return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}
