import { describe, expect, it } from "vitest";
import type { ApiReporteResumen } from "@/types/api-types";
import { fechaDeHoy, masRecientes, saludo } from "./resumen";

const reporte = (id: string, created_at?: string) => ({ id, created_at }) as ApiReporteResumen;
const ids = (list: ApiReporteResumen[]) => list.map((item) => item.id);

describe("resumen", () => {
    it("saluda según la hora de Tijuana (UTC-7 en octubre) con el primer nombre", () => {
        expect(saludo("Bruce Cervantes", Date.parse("2026-10-26T16:00:00Z"))).toBe("Buenos días, Bruce"); // 09:00
        expect(saludo("Bruce", Date.parse("2026-10-26T21:00:00Z"))).toBe("Buenas tardes, Bruce"); // 14:00
        expect(saludo("Bruce", Date.parse("2026-10-27T03:00:00Z"))).toBe("Buenas noches, Bruce"); // 20:00 del 26
        expect(saludo(undefined, Date.parse("2026-10-26T21:00:00Z"))).toBe("Buenas tardes");
    });

    it("fecha de hoy en Tijuana, con mayúscula inicial", () => {
        // 03:00 UTC del 27 son las 20:00 del lunes 26 en Tijuana.
        expect(fechaDeHoy(Date.parse("2026-10-27T03:00:00Z"))).toBe("Lunes 26 de octubre · Tijuana");
    });

    it("más recientes primero; sin created_at respeta el orden recibido", () => {
        const sinFecha = [reporte("a"), reporte("b"), reporte("c")];
        expect(ids(masRecientes(sinFecha, 2))).toEqual(["a", "b"]);

        const conFecha = [reporte("viejo", "2026-10-20T10:00:00Z"), reporte("nuevo", "2026-10-26T10:00:00Z"), reporte("medio", "2026-10-22T10:00:00Z")];
        expect(ids(masRecientes(conFecha, 5))).toEqual(["nuevo", "medio", "viejo"]);
        expect(ids(conFecha)).toEqual(["viejo", "nuevo", "medio"]);
    });
});
