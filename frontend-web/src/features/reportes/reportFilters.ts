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
/** Los que marca "Solo oficiales" en "Capas y filtros" y en Todos: un aviso oficial nace verificado y luego se cierra. */
export const OFFICIAL_STATUSES: ApiEstadoReporte[] = ["Verificado", "Resuelto", "Descartado"];

/** Lo que se ve al entrar: los abiertos de todas las categorías. */
export const DEFAULT_FILTERS: ReportFilters = { hiddenCategories: [], statuses: OPEN_STATUSES, onlyOfficial: false, period: "ahora" };

// GET /reportes devuelve todos los reportes no históricos en cualquier estado.
export const tabFilters: Record<ReportTab, (reporte: ApiReporteResumen) => boolean> = {
    activos: (reporte) => OPEN_STATUSES.includes(reporte.estado_actual),
    todos: () => true,
};

/** Estados de cada pestaña de la lista: los que tienen chip mientras está activa. */
export const TAB_STATUSES: Record<ReportTab, ApiEstadoReporte[]> = { activos: OPEN_STATUSES, todos: ALL_STATUSES };

/** Los estados que marca una pestaña al entrar en ella: con "Solo oficiales", solo los de los avisos oficiales. */
export function tabStatuses(tab: ReportTab, onlyOfficial: boolean): ApiEstadoReporte[] {
    if (!onlyOfficial) return TAB_STATUSES[tab];
    return tab === "activos" ? ["Verificado"] : OFFICIAL_STATUSES;
}

/** Pestaña que corresponde a unos estados: con alguno cerrado es Todos, la única que tiene chip para ellos. */
export function tabOf(statuses: ApiEstadoReporte[]): ReportTab {
    return statuses.every((status) => OPEN_STATUSES.includes(status)) ? "activos" : "todos";
}

/** "Solo oficiales" desde la lista: se queda en la misma pestaña, con los estados que le tocan (ver tabStatuses). */
export function toggledOfficial({ statuses, onlyOfficial }: ReportFilters): Pick<ReportFilters, "statuses" | "onlyOfficial"> {
    return { statuses: tabStatuses(tabOf(statuses), !onlyOfficial), onlyOfficial: !onlyOfficial };
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

/** Un chip de estado de la lista. En Activos, marcar Pendiente o Probable quita "Solo oficiales": se piden también los ciudadanos. */
export function toggledStatus({ statuses, onlyOfficial }: ReportFilters, status: ApiEstadoReporte): Pick<ReportFilters, "statuses" | "onlyOfficial"> {
    const addsCitizenStatus = tabOf(statuses) === "activos" && status !== "Verificado" && !statuses.includes(status);
    return { statuses: toggled(statuses, status), onlyOfficial: onlyOfficial && !addsCitizenStatus };
}

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
