import { describe, expect, it } from "vitest";
import { paddingLibre } from "./freeMapPadding";

describe("paddingLibre", () => {
    it("deja lo encuadrado entre el panel y los controles (768 px, panel de ~444 px)", () => {
        const p = paddingLibre(768, 1024, 444, 712);
        expect(p.left).toBe(484); // el centro del encuadre ya no queda detrás del panel
        expect(p.right).toBe(96);
        expect(768 - p.left - p.right).toBeGreaterThanOrEqual(160);
    });

    it("en escritorio también esquiva el panel", () => {
        expect(paddingLibre(1600, 900, 444, 1544)).toEqual({ top: 120, bottom: 120, left: 484, right: 96 });
    });

    it("sin panel abierto usa el margen normal a la izquierda", () => {
        expect(paddingLibre(1600, 900, null, 1544)).toEqual({ top: 120, bottom: 120, left: 120, right: 96 });
    });

    it("si no queda espacio libre vuelve al padding simétrico", () => {
        expect(paddingLibre(700, 900, 560, 650)).toEqual({ top: 116, bottom: 116, left: 116, right: 116 });
    });

    it("en teléfono el margen no pasa del tamaño del mapa", () => {
        const p = paddingLibre(390, 700, null, null);
        expect(p.left).toBe(65);
        expect(390 - p.left - p.right).toBeGreaterThan(0);
    });
});
