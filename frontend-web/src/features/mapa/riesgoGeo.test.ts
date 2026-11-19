import { describe, expect, it } from "vitest";
import type { ApiZonaRiesgo } from "@/types/api-types";
import { areaCanonica, celdasGeoJSON, zonaBounds, zonasGeoJSON } from "./riesgoGeo";

const zona = (nivel: ApiZonaRiesgo["nivel"], radio_m = 300): ApiZonaRiesgo => ({
    nombre: "Zona", latitude: 32.5, longitude: -117, radio_m, score: 0.5, nivel, reportes: 5,
});

describe("riesgoGeo", () => {
    it("normaliza el peso de cada celda contra el máximo", () => {
        const fc = celdasGeoJSON({
            tamano_celda_m: 500,
            peso_maximo: 4,
            celdas: [
                { latitude: 32.5, longitude: -117, peso: 4, reportes: 4 },
                { latitude: 32.6, longitude: -117.1, peso: 1, reportes: 2 },
            ],
        });
        expect(fc.features.map((f) => f.properties?.w)).toEqual([1, 0.25]);
        expect(fc.features[1].geometry.coordinates).toEqual([-117.1, 32.6]);
    });

    it("sin datos o con peso máximo 0 no falla", () => {
        expect(celdasGeoJSON(null).features).toEqual([]);
        expect(celdasGeoJSON({ tamano_celda_m: 50, peso_maximo: 0, celdas: [{ latitude: 1, longitude: 1, peso: 0, reportes: 0 }] })
            .features[0].properties?.w).toBe(0);
    });

    it("dibuja cada zona como un círculo del color de su nivel", () => {
        const fc = zonasGeoJSON([zona("Alto"), zona("Medio")]);
        expect(fc.features.map((f) => f.properties?.color)).toEqual(["#d93f3f", "#d08a1c"]);
        expect(fc.features[0].geometry.type).toBe("Polygon");
    });

    it("la caja de una zona cubre su radio", () => {
        const [[w, s], [e, n]] = zonaBounds(zona("Alto", 1113.2)); // ~0.01° de latitud
        expect(n - s).toBeCloseTo(0.02, 3);
        expect(w).toBeLessThan(-117);
        expect(e).toBeGreaterThan(-117);
    });

    describe("areaCanonica", () => {
        it("deja igual una vista normal", () => {
            expect(areaCanonica(-117.2, 32.4, -116.8, 32.6)).toEqual({ min_lat: 32.4, max_lat: 32.6, min_lng: -117.2, max_lng: -116.8 });
        });

        it("lleva a -180..180 una copia del mundo desplazada", () => {
            const derecha = areaCanonica(242, 32.4, 244, 32.6);
            expect(derecha.min_lng).toBeCloseTo(-118, 9);
            expect(derecha.max_lng).toBeCloseTo(-116, 9);
            const izquierda = areaCanonica(-478, 32.4, -476, 32.6);
            expect(izquierda.min_lng).toBeCloseTo(-118, 9);
            expect(izquierda.max_lng).toBeCloseTo(-116, 9);
        });

        it("pide todas las longitudes si cruza el antimeridiano o ve el mundo entero", () => {
            expect(areaCanonica(170, 0, 190, 10)).toMatchObject({ min_lng: -180, max_lng: 180 });
            expect(areaCanonica(-200, -80, 300, 80)).toMatchObject({ min_lng: -180, max_lng: 180 });
        });

        it("limita la latitud al rango del contrato", () => {
            expect(areaCanonica(-10, -95, 10, 95)).toMatchObject({ min_lat: -90, max_lat: 90 });
        });
    });
});
