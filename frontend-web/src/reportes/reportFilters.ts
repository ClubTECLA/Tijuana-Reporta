import type { ApiEstadoReporte, ApiReporteResumen } from "../types/api-types";

// Filtros de incidentes compartidos por el panel "Incidentes" (pestañas y chips) y la capa del mapa.

export type ReportTab = "activos" | "resueltos" | "todos";
export type StatusFilter = Extract<ApiEstadoReporte, "Pendiente" | "Verificado">;

export interface ReportFilters {
    tab: ReportTab
    statusFilters: StatusFilter[]
    onlyOfficial: boolean
}

export const STATUS_FILTERS: StatusFilter[] = ["Pendiente", "Verificado"];
const CLOSED_STATES: ApiEstadoReporte[] = ["Resuelto", "Descartado"];

// GET /reportes devuelve todos los reportes no históricos en cualquier estado: las pestañas filtran por estado.
export const tabFilters: Record<ReportTab, (reporte: ApiReporteResumen) => boolean> = {
    activos: (reporte) => !CLOSED_STATES.includes(reporte.estado_actual),
    resueltos: (reporte) => reporte.estado_actual === "Resuelto",
    todos: () => true,
};

/** Aplica pestaña y chips; sin chips de estado seleccionados no se filtra por estado. */
export function filterReportes(reportes: ApiReporteResumen[], { tab, statusFilters, onlyOfficial }: ReportFilters) {
    return reportes.filter((reporte) =>
        tabFilters[tab](reporte)
        && (statusFilters.length === 0 || (statusFilters as ApiEstadoReporte[]).includes(reporte.estado_actual))
        && (!onlyOfficial || reporte.es_oficial)
    );
}
