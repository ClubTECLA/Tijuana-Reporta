import { describe, expect, it } from "vitest";
import { activeFilterLabels, ALL_STATUSES, DEFAULT_FILTERS, filterReportes, tabOf } from "./reportFilters";
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

    it("solo oficiales, en cualquier estado", () => {
        expect(ids(filterReportes(reportes, { ...DEFAULT_FILTERS, statuses: ALL_STATUSES, onlyOfficial: true }))).toEqual(["verificado"]);
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

    it("nombra la pestaña o los estados, las categorías ocultas, Oficiales y el periodo, en ese orden", () => {
        expect(activeFilterLabels({ hiddenCategories: [1, 2], statuses: ["Resuelto"], onlyOfficial: true, period: "24h" }))
            .toEqual(["Resueltos", "2 categorías ocultas", "Oficiales", "Últimas 24 horas"]);
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ALL_STATUSES })).toEqual(["Todos los estados"]);
        expect(activeFilterLabels({ ...DEFAULT_FILTERS, statuses: ["Pendiente"], hiddenCategories: [3] }))
            .toEqual(["Pendiente", "1 categoría oculta"]);
    });
});

describe("tabOf", () => {
    it("los estados abiertos, con o sin chips, son la pestaña Activos", () => {
        expect(tabOf([])).toBe("activos");
        expect(tabOf(["Pendiente", "Verificado"])).toBe("activos");
    });

    it("solo Resuelto es Resueltos y los cinco estados son Todos", () => {
        expect(tabOf(["Resuelto"])).toBe("resueltos");
        expect(tabOf(["Pendiente", "Probable", "Verificado", "Resuelto", "Descartado"])).toBe("todos");
    });

    it("una mezcla que ninguna pestaña representa no marca ninguna", () => {
        expect(tabOf(["Resuelto", "Pendiente"])).toBeNull();
        expect(tabOf(["Descartado"])).toBeNull();
    });
});
