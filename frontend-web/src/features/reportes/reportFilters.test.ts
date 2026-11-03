import { describe, expect, it } from "vitest";
import { activeFilterLabels, ALL_STATUSES, DEFAULT_FILTERS, filterReportes, OPEN_STATUSES, tabOf, toggledOfficial } from "./reportFilters";
import type { ApiEstadoReporte, ApiReporteResumen } from "@/types/api-types";

const reporte = (id: string, estado_actual: ApiEstadoReporte, es_oficial = false) =>
    ({ id, estado_actual, es_oficial }) as ApiReporteResumen;

const reportes = [
    reporte("pendiente", "Pendiente"),
    reporte("verificado", "Verificado", true),
    reporte("probable", "Probable"),
    reporte("resuelto", "Resuelto"),
    reporte("descartado", "Descartado"),
];
const ids = (list: ApiReporteResumen[]) => list.map((item) => item.id);

describe("filterReportes", () => {
    it("de entrada muestra los abiertos de todas las categorías", () => {
        expect(ids(filterReportes(reportes, DEFAULT_FILTERS))).toEqual(["pendiente", "verificado", "probable"]);
    });

    it("con estados elegidos se ven solo esos, también los cerrados", () => {
        expect(ids(filterReportes(reportes, { ...DEFAULT_FILTERS, statuses: ["Resuelto", "Probable"] }))).toEqual(["probable", "resuelto"]);
    });

    it("sin ningún estado marcado no se ve nada", () => {
        expect(filterReportes(reportes, { ...DEFAULT_FILTERS, statuses: [] })).toEqual([]);
    });

    it("solo oficiales se combina con los estados marcados", () => {
        const conOficialCerrado = [...reportes, reporte("oficial-resuelto", "Resuelto", true)];
        const oficiales = (statuses: ApiEstadoReporte[]) => ids(filterReportes(conOficialCerrado, { ...DEFAULT_FILTERS, statuses, onlyOfficial: true }));
        expect(oficiales(OPEN_STATUSES)).toEqual(["verificado"]);
        expect(oficiales(ALL_STATUSES)).toEqual(["verificado", "oficial-resuelto"]);
        expect(oficiales(["Pendiente"])).toEqual([]);
    });

    it("oculta las categorías apagadas", () => {
        const conCategoria = [{ ...reportes[0], incidente_id: 1 }, { ...reportes[2], incidente_id: 2 }];
        expect(ids(filterReportes(conCategoria, { ...DEFAULT_FILTERS, hiddenCategories: [1] }))).toEqual(["probable"]);
    });

    it("el periodo deja fuera lo anterior y lo que no trae fecha", () => {
        const now = Date.parse("2026-11-01T12:00:00Z");
        const fechados = [
            { ...reportes[0], created_at: "2026-11-01T08:00:00Z" },
            { ...reportes[2], created_at: "2026-10-29T08:00:00Z" },
            reportes[1],
        ];
        expect(ids(filterReportes(fechados, { ...DEFAULT_FILTERS, period: "24h" }, now))).toEqual(["pendiente"]);
        expect(ids(filterReportes(fechados, { ...DEFAULT_FILTERS, period: "7d" }, now))).toEqual(["pendiente", "probable"]);
    });
});

describe("activeFilterLabels", () => {
    it("con los filtros de entrada no hay nada que avisar", () => {
        expect(activeFilterLabels(DEFAULT_FILTERS)).toEqual([]);
    });

    it("nombra los estados, las categorías ocultas, Oficiales y el periodo, en ese orden", () => {
        expect(activeFilterLabels({ hiddenCategories: [1, 2], statuses: ["Resuelto"], onlyOfficial: true, period: "24h" }))
            .toEqual(["Resuelto", "2 categorías ocultas", "Oficiales", "Últimas 24 horas"]);
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ALL_STATUSES })).toEqual(["Todos los estados"]);
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ["Pendiente"], hiddenCategories: [3] }))
            .toEqual(["Pendiente", "1 categoría oculta"]);
    });

    it("con algún cerrado y solo algunos estados los nombra, en vez de decir que son todos", () => {
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ["Pendiente", "Resuelto"] })).toEqual(["Pendiente", "Resuelto"]);
    });

    it("avisa si no hay ningún estado marcado, y no si están los de entrada en otro orden", () => {
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: [] })).toEqual(["Ningún estado"]);
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ["Verificado", "Pendiente", "Probable"] })).toEqual([]);
    });
});

describe("toggledOfficial", () => {
    it("en Activos deja solo Verificado, y al quitarlo vuelven los abiertos", () => {
        const marcado = toggledOfficial(DEFAULT_FILTERS);
        expect(marcado).toEqual({ statuses: ["Verificado"], onlyOfficial: true });
        expect(toggledOfficial({ ...DEFAULT_FILTERS, ...marcado })).toEqual({ statuses: OPEN_STATUSES, onlyOfficial: false });
    });

    it("en Todos no toca los estados", () => {
        expect(toggledOfficial({ ...DEFAULT_FILTERS, statuses: ["Resuelto"] })).toEqual({ statuses: ["Resuelto"], onlyOfficial: true });
        expect(toggledOfficial({ ...DEFAULT_FILTERS, statuses: ALL_STATUSES })).toEqual({ statuses: ALL_STATUSES, onlyOfficial: true });
    });
});

describe("tabOf", () => {
    it("los estados abiertos, todos, algunos o ninguno, son la pestaña Activos", () => {
        expect(tabOf(OPEN_STATUSES)).toBe("activos");
        expect(tabOf(["Pendiente", "Verificado"])).toBe("activos");
        expect(tabOf([])).toBe("activos");
    });

    it("con algún estado cerrado es la pestaña Todos, para que tenga su chip", () => {
        expect(tabOf(ALL_STATUSES)).toBe("todos");
        expect(tabOf(["Resuelto"])).toBe("todos");
        expect(tabOf(["Descartado"])).toBe("todos");
        expect(tabOf(["Resuelto", "Pendiente"])).toBe("todos");
    });
});
