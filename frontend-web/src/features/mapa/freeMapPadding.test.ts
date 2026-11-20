import { describe, expect, it } from "vitest";
import { paddingLibre } from "./freeMapPadding";

describe("paddingLibre", () => {
    it("deja lo encuadrado entre el panel y los controles (medidas reales a 768 px)", () => {
        const p = paddingLibre(768, 1024, 481, 694, 128);
        expect(p.left).toBe(497); // el centro del encuadre ya no queda detrás del panel
        expect(p.right).toBe(90);
        expect((p.left + 768 - p.right) / 2).toBeCloseTo(587.5); // centro del espacio libre
    });

    it("en escritorio también esquiva el panel", () => {
        expect(paddingLibre(1600, 900, 481, 1526, 64)).toEqual({ top: 120, bottom: 120, left: 497, right: 90 });
    });

    it("sin panel abierto usa el margen normal a la izquierda", () => {
        expect(paddingLibre(1600, 900, null, 1526, 64)).toEqual({ top: 120, bottom: 120, left: 120, right: 90 });
    });

    it("si no queda espacio libre vuelve al padding simétrico", () => {
        expect(paddingLibre(700, 900, 600, 650, null)).toEqual({ top: 116, bottom: 116, left: 116, right: 116 });
    });

    it("arriba deja libre la cabecera de dos filas (teléfono en horizontal, 844 × 390)", () => {
        const p = paddingLibre(844, 390, null, 800, 136);
        expect(p.top).toBe(152); // 136 de cabecera + 16; antes era 65 y la zona quedaba debajo de la cabecera
        expect(390 - p.top - p.bottom).toBeGreaterThanOrEqual(80);
    });

    it("con la cabecera más arriba que el margen, se usa el margen", () => {
        expect(paddingLibre(1600, 900, null, null, 64).top).toBe(120);
    });

    it("si no queda ancho libre, los lados vuelven al margen pero arriba sigue respetando la cabecera", () => {
        expect(paddingLibre(700, 900, 600, 650, 128)).toEqual({ top: 144, bottom: 116, left: 116, right: 116 });
    });

    it("en teléfono el margen no pasa del tamaño del mapa", () => {
        const p = paddingLibre(390, 700, null, null, null);
        expect(p.left).toBe(65);
        expect(390 - p.left - p.right).toBeGreaterThan(0);
    });
});
