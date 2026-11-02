import { createContext } from "react";
import type { ApiIncidente, ApiReporteResumen } from "@/types/api-types";
import type { ReportFilters } from "./reportFilters";
import type { FalloFoto, NuevoReporte, Publicacion } from "./publicarReporte";

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
    /** Reportes que pasan el filtro: los pinta el mapa y los lista el panel "Incidentes", así siempre coinciden. */
    filteredReportes: ApiReporteResumen[]
    filters: ReportFilters
    /** Sustituye el filtro: lo usan "Mostrar N resultados" de "Capas y filtros" y los atajos de la lista. */
    setFilters: (filters: ReportFilters) => void
    /** Vuelve a DEFAULT_FILTERS (los abiertos de todas las capas y categorías). */
    resetFilters: () => void
    refresh: () => Promise<void>
    /** Publica un reporte (ver publicarReporte), resalta su pin y recarga la lista y el mapa. */
    publicar: (nuevo: NuevoReporte) => Promise<Publicacion>
    /** Reintenta solo la foto de un reporte recién publicado (ver subirFoto); null si quedó guardada. */
    reintentarFoto: (reporteId: string, foto: Blob) => Promise<FalloFoto | null>
    /** Id del reporte recién publicado, para animar su pin; se limpia solo. */
    createdId: string | null
    /** Momento (ms) de la última carga correcta de los reportes; null hasta la primera. Lo muestra el "En vivo" del dock. */
    lastSync: number | null
}

export const ReportesContext = createContext<ReportesContextType | undefined>(undefined);
