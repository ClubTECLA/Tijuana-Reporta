import { describe, expect, it } from "vitest";
import type { ApiIncidente } from "@/types/api-types";
import { barrasCategorias, formatCount, formatScore, subtituloModelo } from "./riesgo";

const categoria = (id: number, etiqueta: string, color: string) => ({ id, nombre: etiqueta.toLowerCase(), etiqueta, color }) as ApiIncidente;

describe("riesgo", () => {
    it("muestra el índice con dos decimales", () => {
        expect(formatScore(0.8235)).toBe("0.82");
        expect(formatScore(1)).toBe("1.00");
    });

    it("subtítulo del modelo con la hora de Tijuana", () => {
        const now = Date.parse("2026-11-16T22:00:00Z"); // 14:00 en Tijuana
        expect(subtituloModelo("2026-11-16T21:20:00Z", 1, now)).toBe("Modelo actualizado hoy 13:20 · versión 1");
        expect(subtituloModelo("no-es-fecha", 2, now)).toBe("Modelo versión 2");
    });

    it("barras por categoría ordenadas y proporcionales al mayor", () => {
        const categorias = new Map([
            [1, categoria(1, "Inundación", "#2677e6")],
            [2, categoria(2, "Deslave", "#7a3b12")],
        ]);
        const barras = barrasCategorias([{ incidente_id: 2, total: 25 }, { incidente_id: 1, total: 100 }, { incidente_id: 9, total: 50 }], categorias);
        expect(barras.map((b) => [b.nombre, b.total, b.ratio])).toEqual([
            ["Inundación", 100, 1],
            ["Categoría 9", 50, 0.5], // fuera del catálogo: no se pierde
            ["Deslave", 25, 0.25],
        ]);
        expect(barras[0].color).toBe("#2677e6");
        expect(barrasCategorias([], categorias)).toEqual([]);
    });

    it("separa los miles con espacio", () => {
        expect(formatCount(1842)).toBe("1 842");
        expect(formatCount(415)).toBe("415");
    });
});
