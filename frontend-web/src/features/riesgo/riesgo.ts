import { shortDate } from "@/features/reportes/reportFormat";
import type { ApiConteoCategoria, ApiIncidente, ApiNivelRiesgo } from "@/types/api-types";

// Presentación del riesgo, compartida por el panel y la capa del mapa.

/**
 * Color de cada nivel. Son hexadecimales (no variables CSS) porque también los usa MapLibre, que no las entiende.
 * Alto y Medio son los del Figma (borde rojo y ámbar de las zonas); Bajo, un gris para que no compita con ellos.
 */
export const NIVEL_COLORS: Record<ApiNivelRiesgo, string> = {
    Alto: "#d93f3f",
    Medio: "#d08a1c",
    Bajo: "#8a94a3",
};

/** Tono de la etiqueta de nivel (ver Badge). */
export const NIVEL_TONES = { Alto: "danger", Medio: "warning", Bajo: "neutral" } as const satisfies Record<ApiNivelRiesgo, string>;

/** Índice de riesgo con dos decimales, como en el Figma ("0.82"). */
export function formatScore(score: number) {
    return score.toFixed(2);
}

/** "Modelo actualizado hoy 14:20 · versión 1". */
export function subtituloModelo(generadoEn: string, version: number, now = Date.now()) {
    const cuando = shortDate(generadoEn, now);
    return cuando ? `Modelo actualizado ${cuando} · versión ${version}` : `Modelo versión ${version}`;
}

export interface BarraCategoria {
    id: number
    nombre: string
    color: string
    total: number
    /** Largo de la barra (0 a 1): total entre el mayor total. */
    ratio: number
}

/** Barras de "Incidentes por categoría": nombre y color del catálogo, de mayor a menor. */
export function barrasCategorias(conteos: ApiConteoCategoria[], categorias: Map<number, ApiIncidente>): BarraCategoria[] {
    const max = Math.max(0, ...conteos.map((c) => c.total));
    return [...conteos]
        .sort((a, b) => b.total - a.total)
        .map((c) => {
            const categoria = categorias.get(c.incidente_id);
            return {
                id: c.incidente_id,
                nombre: categoria?.etiqueta ?? categoria?.nombre ?? `Categoría ${c.incidente_id}`,
                color: categoria?.color ?? NIVEL_COLORS.Bajo,
                total: c.total,
                ratio: max ? c.total / max : 0,
            };
        });
}

/** Miles con espacio fino, como en el Figma ("1 842"). */
export function formatCount(value: number) {
    return new Intl.NumberFormat("es-MX").format(value).replace(/,/g, " ");
}
