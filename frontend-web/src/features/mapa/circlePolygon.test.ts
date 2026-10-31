import { describe, expect, it } from "vitest";
import { circlePolygon } from "./circlePolygon";

const toRad = (deg: number) => (deg * Math.PI) / 180;
// Distancia real (haversine) para comprobar el radio sin depender de la misma aproximación.
function meters([lng1, lat1]: number[], [lng2, lat2]: number[]) {
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lng2 - lng1) / 2) ** 2;
    return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}

describe("circlePolygon", () => {
    const center = [-117.0382, 32.5149];
    const [ring] = circlePolygon(center[0], center[1], 1500).coordinates;

    it("es un anillo cerrado", () => {
        expect(ring.at(-1)).toEqual(ring[0]);
    });

    it("todos sus puntos quedan a la distancia del radio (en Tijuana, con menos de 1 % de error)", () => {
        for (const point of ring) expect(Math.abs(meters(center, point) - 1500)).toBeLessThan(15);
    });
});
