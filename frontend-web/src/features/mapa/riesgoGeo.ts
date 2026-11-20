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

/** Área que pide el mapa de calor, siempre con longitudes de -180 a 180 (lo exige el contrato). */
export interface AreaCanonica {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
}

/**
 * Lleva la vista del mapa a longitudes de -180 a 180. MapLibre repite el mundo al desplazarse, así que Tijuana puede
 * verse en 242..244 en vez de -118..-116: se resta (o suma) una vuelta entera conservando el ancho. Si la vista ocupa
 * el mundo entero o cruza el antimeridiano (180°), no cabe en un solo intervalo y se piden todas las longitudes; el
 * backend parte las áreas anchas y el mapa solo dibuja lo que está a la vista.
 */
export function areaCanonica(oeste: number, sur: number, este: number, norte: number): AreaCanonica {
    const lat = { min_lat: Math.max(-90, sur), max_lat: Math.min(90, norte) };
    const ancho = este - oeste;
    if (ancho >= 360) return { ...lat, min_lng: -180, max_lng: 180 };
    // Ya en rango (lo normal): sin tocarla, para no meter errores de redondeo.
    if (oeste >= -180 && este <= 180) return { ...lat, min_lng: oeste, max_lng: este };
    const minLng = ((((oeste + 180) % 360) + 360) % 360) - 180;
    if (minLng + ancho > 180) return { ...lat, min_lng: -180, max_lng: 180 };
    return { ...lat, min_lng: minLng, max_lng: minLng + ancho };
}
