import { createContext } from "react";
import type { ApiMapaCalor, ApiResumenRiesgo, ApiZonaRiesgo } from "@/types/api-types";

/** Área visible del mapa y su zoom: lo que pide GET /riesgo/mapa-calor. */
export interface VistaMapa {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
    zoom: number
}

// El contexto solo declara el contrato; RiesgoProvider lo conecta con la API. Lo usan el panel "Riesgo" y la capa
// del mapa (features/mapa/RiesgoLayer), que es la única que toca MapLibre.
export interface RiesgoContextType {
    /** El usuario puede ver el riesgo: cualquier rol menos ciudadano (misma regla que el backend). */
    puedeVer: boolean
    /** El panel "Riesgo" está abierto: solo entonces se piden datos y el mapa muestra el calor y las zonas. */
    activo: boolean
    /** null mientras llega la primera carga. */
    resumen: ApiResumenRiesgo | null
    /** Último fallo al cargar el resumen; null si la última carga fue bien. */
    error: string | null
    /** Celdas del área visible; null hasta la primera carga. */
    mapaCalor: ApiMapaCalor | null
    /** La capa del mapa la llama al moverse; cancela la petición anterior. */
    cargarMapaCalor: (vista: VistaMapa) => void
    /** Zona elegida en la lista: la capa del mapa la centra. */
    zonaEnfocada: ApiZonaRiesgo | null
    enfocarZona: (zona: ApiZonaRiesgo | null) => void
    /** Lo llama el panel "Riesgo" al abrirse (true) y al cerrarse (false). */
    setPanelAbierto: (abierto: boolean) => void
    refresh: () => Promise<void>
}

export const RiesgoContext = createContext<RiesgoContextType | undefined>(undefined);
