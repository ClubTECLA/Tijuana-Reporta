import type { ApiEstadoReporte, ApiReporteResumen } from "@/types/api-types";

// Un solo filtro de incidentes para el mapa y la lista del panel "Incidentes": lo que muestra la lista es lo que hay
// en el mapa. Se edita entero desde el panel "Capas y filtros", y las pestañas y chips de la lista son atajos sobre él.
// La regla: lo marcado es lo que se ve. Dentro de una sección vale cualquiera de lo marcado, y un reporte tiene que
// cumplir todas las secciones.

export type ReportTab = "activos" | "resueltos" | "todos";
export type MapPeriod = "ahora" | "24h" | "7d";

export interface ReportFilters {
    /** Se guardan las ocultas y no las visibles: una categoría nueva aparece sin tocar el filtro. */
    hiddenCategories: number[]
    /** Los estados que se ven; sin ninguno no se ve nada. */
    statuses: ApiEstadoReporte[]
    /** De los estados marcados, solo los avisos oficiales (publicados por autoridades). */
    onlyOfficial: boolean
    period: MapPeriod
}

export const OPEN_STATUSES: ApiEstadoReporte[] = ["Pendiente", "Probable", "Verificado"];
export const ALL_STATUSES: ApiEstadoReporte[] = [...OPEN_STATUSES, "Resuelto", "Descartado"];

/** Lo que se ve al entrar: los abiertos de todas las categorías. */
export const DEFAULT_FILTERS: ReportFilters = { hiddenCategories: [], statuses: OPEN_STATUSES, onlyOfficial: false, period: "ahora" };

// GET /reportes devuelve todos los reportes no históricos en cualquier estado.
export const tabFilters: Record<ReportTab, (reporte: ApiReporteResumen) => boolean> = {
    activos: (reporte) => OPEN_STATUSES.includes(reporte.estado_actual),
    resueltos: (reporte) => reporte.estado_actual === "Resuelto",
    todos: () => true,
};

/** Estados que pone cada pestaña de la lista. */
export const TAB_STATUSES: Record<ReportTab, ApiEstadoReporte[]> = { activos: OPEN_STATUSES, resueltos: ["Resuelto"], todos: ALL_STATUSES };

/** Pestaña que corresponde a unos estados; null si es una mezcla que ninguna pestaña representa (p. ej. Resuelto y Pendiente) o no hay ninguno. */
export function tabOf(statuses: ApiEstadoReporte[]): ReportTab | null {
    if (!statuses.length) return null;
    if (statuses.every((status) => OPEN_STATUSES.includes(status))) return "activos";
    if (statuses.length === 1 && statuses[0] === "Resuelto") return "resueltos";
    if (ALL_STATUSES.every((status) => statuses.includes(status))) return "todos";
    return null;
}

const PERIOD_LABELS: Record<Exclude<MapPeriod, "ahora">, string> = { "24h": "Últimas 24 horas", "7d": "Últimos 7 días" };

function statusLabels(statuses: ApiEstadoReporte[]): string[] {
    const tab = tabOf(statuses);
    if (!statuses.length) return ["Ningún estado"];
    if (tab === "activos" && statuses.length === OPEN_STATUSES.length) return [];
    if (tab === "resueltos") return ["Resueltos"];
    if (tab === "todos") return ["Todos los estados"];
    return statuses;
}

/**
 * Nombres de lo que difiere de DEFAULT_FILTERS ("Resueltos", "2 categorías ocultas", "Oficiales"); vacío si no hay
 * filtro. Los estados van por el nombre de su pestaña cuando la hay.
 */
export function activeFilterLabels({ hiddenCategories, statuses, onlyOfficial, period }: ReportFilters): string[] {
    const hidden = hiddenCategories.length;
    return [
        ...statusLabels(statuses),
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
        && statuses.includes(reporte.estado_actual)
        && (!onlyOfficial || reporte.es_oficial)
        && (period === "ahora" || Date.parse(reporte.created_at ?? "") >= now - PERIOD_MS[period])
    );
}
