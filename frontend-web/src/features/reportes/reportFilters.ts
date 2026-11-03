import type { ApiEstadoReporte, ApiReporteResumen } from "@/types/api-types";

// Un solo filtro de incidentes para el mapa y la lista del panel "Incidentes": lo que muestra la lista es lo que hay
// en el mapa. Se edita entero desde el panel "Capas y filtros", y las pestañas y chips de la lista son atajos sobre él.
// La regla: lo marcado es lo que se ve. Dentro de una sección vale cualquiera de lo marcado, y un reporte tiene que
// cumplir todas las secciones.

export type ReportTab = "activos" | "todos";
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
    todos: () => true,
};

/** Estados de cada pestaña de la lista: los que marca al pulsarla y los que tienen chip mientras está activa. */
export const TAB_STATUSES: Record<ReportTab, ApiEstadoReporte[]> = { activos: OPEN_STATUSES, todos: ALL_STATUSES };

/** Pestaña que corresponde a unos estados: con alguno cerrado es Todos, la única que tiene chip para ellos. */
export function tabOf(statuses: ApiEstadoReporte[]): ReportTab {
    return statuses.every((status) => OPEN_STATUSES.includes(status)) ? "activos" : "todos";
}

/**
 * "Solo oficiales" desde la lista. En Activos deja solo Verificado, porque los oficiales nacen verificados, y al
 * quitarlo vuelven los abiertos. En Todos no toca los estados.
 */
export function toggledOfficial({ statuses, onlyOfficial }: ReportFilters): Pick<ReportFilters, "statuses" | "onlyOfficial"> {
    if (tabOf(statuses) !== "activos") return { statuses, onlyOfficial: !onlyOfficial };
    return { statuses: onlyOfficial ? OPEN_STATUSES : ["Verificado"], onlyOfficial: !onlyOfficial };
}

const PERIOD_LABELS: Record<Exclude<MapPeriod, "ahora">, string> = { "24h": "Últimas 24 horas", "7d": "Últimos 7 días" };

function statusLabels(statuses: ApiEstadoReporte[]): string[] {
    if (!statuses.length) return ["Ningún estado"];
    if (tabOf(statuses) === "activos" && statuses.length === OPEN_STATUSES.length) return [];
    if (statuses.length === ALL_STATUSES.length) return ["Todos los estados"];
    return statuses;
}

/** Nombres de lo que difiere de DEFAULT_FILTERS ("Resuelto", "2 categorías ocultas", "Oficiales"); vacío si no hay filtro. */
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
