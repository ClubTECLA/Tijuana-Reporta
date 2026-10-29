import { createContext } from "react";
import type { ApiIncidente, ApiReporteResumen } from "../types/api-types";
import type { ReportFilters, ReportTab, StatusFilter } from "./reportFilters";
import type { NuevoReporte, Publicacion } from "./publicarReporte";

// El contexto solo declara el contrato; ReportesProvider lo conecta con la API, el sondeo y los filtros.
// Es la única puerta de las vistas a los reportes y a las categorías (en el backend, "incidentes").
export interface ReportesContextType {
    /** null mientras llega la primera carga. */
    reportes: ApiReporteResumen[] | null
    /** Todas las categorías, también las inactivas (puede haber reportes de una que ya se desactivó). */
    categories: Map<number, ApiIncidente>
    /** false hasta que llegan las categorías; no depende de los reportes (si fallan, las categorías siguen llegando). */
    categoriesLoaded: boolean
    /** Último fallo al cargar reportes o categorías; null si la última carga fue bien. */
    error: string | null
    /** Reportes que pasan los filtros del panel (pestaña y chips); los usan la lista y el mapa. */
    filteredReportes: ApiReporteResumen[]
    filters: ReportFilters
    setTab: (tab: ReportTab) => void
    toggleStatus: (status: StatusFilter) => void
    toggleOfficial: () => void
    refresh: () => Promise<void>
    /** Publica un reporte (ver publicarReporte), resalta su pin y recarga la lista y el mapa. */
    publicar: (nuevo: NuevoReporte) => Promise<Publicacion>
    /** Id del reporte recién publicado, para animar su pin; se limpia solo. */
    createdId: string | null
}

export const ReportesContext = createContext<ReportesContextType | undefined>(undefined);
