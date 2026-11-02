import type { ApiEstadoReporte, ApiReporteResumen } from "@/types/api-types";

// Un solo filtro de incidentes para el mapa y la lista del panel "Incidentes": lo que muestra la lista es lo que hay
// en el mapa. Se edita entero desde el panel "Capas y filtros", y las pestañas y chips de la lista son atajos sobre él.

export type ReportTab = "activos" | "resueltos" | "todos";
export type MapPeriod = "ahora" | "24h" | "7d";

export interface ReportFilters {
    /** Se guardan las ocultas y no las visibles: una categoría nueva aparece sin tocar el filtro. */
    hiddenCategories: number[]
    /** Vacío: los estados abiertos (sin Resuelto ni Descartado). */
    statuses: ApiEstadoReporte[]
    /** Solo los avisos oficiales (publicados por autoridades), en cualquier estado. */
    onlyOfficial: boolean
    period: MapPeriod
}

export const ALL_STATUSES: ApiEstadoReporte[] = ["Pendiente", "Probable", "Verificado", "Resuelto", "Descartado"];
const CLOSED_STATES: ApiEstadoReporte[] = ["Resuelto", "Descartado"];

/** Lo que se ve al entrar: los abiertos de todas las categorías. */
export const DEFAULT_FILTERS: ReportFilters = { hiddenCategories: [], statuses: [], onlyOfficial: false, period: "ahora" };

// GET /reportes devuelve todos los reportes no históricos en cualquier estado.
export const tabFilters: Record<ReportTab, (reporte: ApiReporteResumen) => boolean> = {
    activos: (reporte) => !CLOSED_STATES.includes(reporte.estado_actual),
    resueltos: (reporte) => reporte.estado_actual === "Resuelto",
    todos: () => true,
};

/** Estados que pone cada pestaña de la lista. */
export const TAB_STATUSES: Record<ReportTab, ApiEstadoReporte[]> = { activos: [], resueltos: ["Resuelto"], todos: ALL_STATUSES };

/** Pestaña que corresponde a unos estados; null si es una mezcla que ninguna pestaña representa (p. ej. Resuelto y Pendiente). */
export function tabOf(statuses: ApiEstadoReporte[]): ReportTab | null {
    if (statuses.every((status) => !CLOSED_STATES.includes(status))) return "activos";
    if (statuses.length === 1 && statuses[0] === "Resuelto") return "resueltos";
    if (ALL_STATUSES.every((status) => statuses.includes(status))) return "todos";
    return null;
}

const PERIOD_LABELS: Record<Exclude<MapPeriod, "ahora">, string> = { "24h": "Últimas 24 horas", "7d": "Últimos 7 días" };

/**
 * Nombres de lo que difiere de DEFAULT_FILTERS ("Resueltos", "2 categorías ocultas", "Oficiales"); vacío si no hay
 * filtro. Los estados van por el nombre de su pestaña cuando la hay.
 */
export function activeFilterLabels({ hiddenCategories, statuses, onlyOfficial, period }: ReportFilters): string[] {
    const tab = tabOf(statuses);
    const hidden = hiddenCategories.length;
    return [
        ...(!statuses.length ? [] : tab === "resueltos" ? ["Resueltos"] : tab === "todos" ? ["Todos los estados"] : statuses),
        ...(hidden ? [`${hidden} ${hidden === 1 ? "categoría oculta" : "categorías ocultas"}`] : []),
        ...(onlyOfficial ? ["Oficiales"] : []),
        ...(period !== "ahora" ? [PERIOD_LABELS[period]] : []),
    ];
}

/** La lista con el elemento añadido si no estaba, o quitado si estaba. */
export const toggled = <T>(list: T[], item: T) => list.includes(item) ? list.filter((value) => value !== item) : [...list, item];

const PERIOD_MS: Record<Exclude<MapPeriod, "ahora">, number> = { "24h": 86_400_000, "7d": 604_800_000 };

/** Reportes que pasan el filtro. Con un periodo, los que no traen created_at quedan fuera. */
export function filterReportes(reportes: ApiReporteResumen[], { hiddenCategories, statuses, onlyOfficial, period }: ReportFilters, now = Date.now()) {
    return reportes.filter((reporte) =>
        !hiddenCategories.includes(reporte.incidente_id)
        && (statuses.length ? statuses.includes(reporte.estado_actual) : !CLOSED_STATES.includes(reporte.estado_actual))
        && (!onlyOfficial || reporte.es_oficial)
        && (period === "ahora" || Date.parse(reporte.created_at ?? "") >= now - PERIOD_MS[period])
    );
}
