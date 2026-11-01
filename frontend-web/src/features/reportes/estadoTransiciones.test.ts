import { describe, expect, it } from "vitest";
import type { ApiEstadoReporte } from "@/types/api-types";
import { esEstadoFinal, estadosSiguientes } from "./estadoTransiciones";

const ORDEN: ApiEstadoReporte[] = ["Pendiente", "Probable", "Verificado", "Resuelto"];

describe("estadoTransiciones", () => {
    it("solo avanza, pudiendo saltar pasos, y Descartado se alcanza desde cualquier estado no final", () => {
        expect(estadosSiguientes("Pendiente")).toEqual(["Probable", "Verificado", "Resuelto", "Descartado"]);
        expect(estadosSiguientes("Probable")).toEqual(["Verificado", "Resuelto", "Descartado"]);
        expect(estadosSiguientes("Verificado")).toEqual(["Resuelto", "Descartado"]);
        for (const estado of ORDEN) {
            const atras = ORDEN.slice(0, ORDEN.indexOf(estado) + 1);
            expect(estadosSiguientes(estado).some((siguiente) => atras.includes(siguiente))).toBe(false);
        }
    });

    it("Resuelto y Descartado son finales", () => {
        expect(estadosSiguientes("Resuelto")).toEqual([]);
        expect(estadosSiguientes("Descartado")).toEqual([]);
        expect(esEstadoFinal("Resuelto")).toBe(true);
        expect(esEstadoFinal("Descartado")).toBe(true);
        expect(esEstadoFinal("Verificado")).toBe(false);
    });
});
