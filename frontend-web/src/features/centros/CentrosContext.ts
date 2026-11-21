import { createContext } from "react";
import type { ApiCentro, ApiCrearCentroRequest, ApiTipoCentro } from "@/types/api-types";
import type { CentroFilters } from "./centroFormat";

// El contexto solo declara el contrato; CentrosProvider lo conecta con la API y el filtro.
// Es la única puerta de las vistas y del mapa a los centros y a sus tipos.
export interface CentrosContextType {
    /** Centros activos; null mientras llega la primera carga. */
    centros: ApiCentro[] | null
    /** Catálogo de tipos por id; vacío hasta que llega. */
    tipos: Map<number, ApiTipoCentro>
    /** Último fallo al cargar; null si la última carga fue bien. */
    error: string | null
    /** Centros que pasan el filtro: los lista el panel "Centros" y los pinta el mapa. */
    filteredCentros: ApiCentro[]
    filters: CentroFilters
    setFilters: (filters: CentroFilters) => void
    refresh: () => Promise<void>
    /** Crea un centro (solo administradores), quita el filtro para que se vea y recarga la lista y el mapa. */
    crear: (nuevo: ApiCrearCentroRequest) => Promise<ApiCentro>
}

export const CentrosContext = createContext<CentrosContextType | undefined>(undefined);
