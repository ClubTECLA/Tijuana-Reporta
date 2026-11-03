import { describe, expect, it } from "vitest";
import { confirmaciones, folio, formatDateTime, fotoUrl, pinOfficialFirst, shortDate, timeAgo } from "./reportFormat";

const now = Date.parse("2026-10-26T12:00:00Z");

describe("reportFormat", () => {
    it("folio es estable y tiene el formato de mobile", () => {
        expect(folio("abc")).toBe(folio("abc"));
        expect(folio("abc")).toMatch(/^INC-\d{4}$/);
    });

    it("confirmaciones en singular solo con una", () => {
        expect(confirmaciones(0)).toBe("0 confirmaciones");
        expect(confirmaciones(1)).toBe("1 confirmación");
        expect(confirmaciones(2)).toBe("2 confirmaciones");
    });

    it("fotoUrl apunta a /multimedia y codifica cada tramo sin tocar las barras", () => {
        expect(fotoUrl("reportes/r1/ab12.jpg")).toBe("/multimedia/reportes/r1/ab12.jpg");
        expect(fotoUrl("reportes/a b/x?.jpg")).toBe("/multimedia/reportes/a%20b/x%3F.jpg");
    });

    it("una fecha inválida no rompe: guion en la fecha y vacío en el tiempo relativo", () => {
        expect(formatDateTime("no-es-fecha")).toBe("—");
        expect(timeAgo("no-es-fecha", now)).toBe("");
    });

    it("muestra la hora de Tijuana aunque el navegador esté en otra zona", () => {
        // 15:21 UTC = 08:21 en Tijuana (horario de verano, UTC-7).
        expect(formatDateTime("2026-10-17T15:21:00Z")).toMatch(/8:21/);
    });

    it("tiempo transcurrido con números, no frases de calendario", () => {
        expect(timeAgo("2026-10-26T11:59:30Z", now)).toBe("ahora");
        expect(timeAgo("2026-10-26T09:00:00Z", now)).toBe("hace 3 horas");
        expect(timeAgo("2026-10-25T09:00:00Z", now)).toBe("hace 1 día");
        expect(timeAgo("2026-10-12T12:00:00Z", now)).toBe("hace 2 semanas");
        expect(timeAgo("2026-08-26T12:00:00Z", now)).toBe("hace 2 meses");
        // 59 días: "hace 1 mes", no "el mes pasado".
        expect(timeAgo("2026-03-31T12:00:00Z", Date.parse("2026-05-29T12:00:00Z"))).toBe("hace 1 mes");
    });

    it("fecha corta: hoy y ayer con hora, el resto con día y mes, y el año solo si es otro", () => {
        // now = 05:00 del 26 oct en Tijuana (UTC-7).
        expect(shortDate("2026-10-26T08:30:00Z", now)).toBe("hoy 01:30");
        // 06:30 UTC del 26 son las 23:30 del 25 en Tijuana.
        expect(shortDate("2026-10-26T06:30:00Z", now)).toBe("ayer 23:30");
        expect(shortDate("2026-10-20T18:00:00Z", now)).toBe("20 oct");
        expect(shortDate("2025-12-31T20:00:00Z", now)).toBe("31 dic 2025");
        expect(shortDate("no-es-fecha", now)).toBe("");
        // El domingo del cambio de horario dura 23 h: a las 00:30 del lunes sigue siendo "ayer".
        expect(shortDate("2026-03-08T19:00:00Z", Date.parse("2026-03-09T07:30:00Z"))).toBe("ayer 12:00");
    });

    it("fija arriba los oficiales (el más reciente primero) y ordena el resto por instante sin mutar la lista", () => {
        const items = [
            { id: "a", created_at: "2026-10-17T14:21:05Z", official: false },
            { id: "b", created_at: "2026-10-17T14:21:05.500Z", official: false },
            { id: "c", created_at: "2026-10-17T10:00:00Z", official: true },
            { id: "d", created_at: "2026-10-17T12:00:00Z", official: true },
        ];

        expect(pinOfficialFirst(items, (item) => item.official).map((item) => item.id)).toEqual(["d", "c", "a", "b"]);
        expect(items.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
    });
});
