import type { ApiCentro } from "@/types/api-types";

// Reglas de presentación de un centro, compartidas por la lista, el mapa y el detalle. Mismo criterio que la app móvil
// (frontend-mobile/src/features/refugios/capacidad.ts): capacidad es el total de lugares y cantidad la gente que hay.

export type CentroTab = "disponibles" | "ocupados" | "todos";

export interface CentroFilters {
    tab: CentroTab
    /** Se guardan los tipos ocultos y no los visibles: un tipo nuevo aparece sin tocar el filtro. */
    hiddenTipos: number[]
}


export const DEFAULT_CENTRO_FILTERS: CentroFilters = { tab: "disponibles", hiddenTipos: [] };

/** Lugares libres; null si falta la capacidad o la gente que hay. Nunca baja de 0. */
export function lugaresDisponibles({ capacidad, cantidad }: Pick<ApiCentro, "capacidad" | "cantidad">): number | null {
    if (capacidad === null || cantidad === null) return null;
    return Math.max(0, capacidad - cantidad);
}

/** Sin lugares libres. Un centro sin capacidad registrada (p. ej. de seguridad) cuenta como disponible. */
export const estaOcupado = (centro: Pick<ApiCentro, "capacidad" | "cantidad">) => lugaresDisponibles(centro) === 0;

/** "1 lugar disponible", "20 lugares disponibles". */
export const lugaresTexto = (lugares: number) => `${lugares} ${lugares === 1 ? "lugar disponible" : "lugares disponibles"}`;

/** Centros que pasan el filtro: los lista el panel "Centros" y los pinta el mapa, así siempre coinciden. */
export function filterCentros(centros: ApiCentro[], { tab, hiddenTipos }: CentroFilters) {
    return centros.filter((centro) =>
        !hiddenTipos.includes(centro.tipo_centro)
        && (tab === "todos" || estaOcupado(centro) === (tab === "ocupados"))
    );
}
