import { describe, expect, it } from "vitest";
import { filterReportes } from "./reportFilters";
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
    it("las pestañas separan activos, resueltos y todos", () => {
        const base = { statusFilters: [], onlyOfficial: false };
        expect(ids(filterReportes(reportes, { ...base, tab: "activos" }))).toEqual(["pendiente", "verificado", "probable"]);
        expect(ids(filterReportes(reportes, { ...base, tab: "resueltos" }))).toEqual(["resuelto"]);
        expect(filterReportes(reportes, { ...base, tab: "todos" })).toHaveLength(5);
    });

    it("sin chips de estado no filtra por estado; con chips, solo esos estados", () => {
        expect(ids(filterReportes(reportes, { tab: "activos", statusFilters: ["Pendiente"], onlyOfficial: false }))).toEqual(["pendiente"]);
    });

    it("solo oficiales", () => {
        expect(ids(filterReportes(reportes, { tab: "todos", statusFilters: [], onlyOfficial: true }))).toEqual(["verificado"]);
    });
});
