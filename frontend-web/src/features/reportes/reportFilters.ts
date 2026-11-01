import type { ApiEstadoReporte, ApiReporteResumen } from "@/types/api-types";

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

/** Lo que se ve al entrar: los activos, sin chips. */
export const DEFAULT_FILTERS: ReportFilters = { tab: "activos", statusFilters: [], onlyOfficial: false };
const TAB_LABELS: Record<ReportTab, string> = { activos: "Activos", resueltos: "Resueltos", todos: "Todos los estados" };

/** Nombres de lo que difiere de DEFAULT_FILTERS ("Resueltos", "Pendiente", "Oficiales"); vacío si no hay filtro. */
export function activeFilterLabels({ tab, statusFilters, onlyOfficial }: ReportFilters): string[] {
    return [
        ...(tab !== DEFAULT_FILTERS.tab ? [TAB_LABELS[tab]] : []),
        ...statusFilters,
        ...(onlyOfficial ? ["Oficiales"] : []),
    ];
}

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
