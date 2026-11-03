import type { ApiEstadoReporte } from "@/types/api-types";

// Mismas transiciones que el backend (backend/internal/domain/reporte.go): los estados solo avanzan, se pueden
// saltar pasos y Descartado se alcanza desde cualquier estado no final. Resuelto y Descartado son finales.
// Si el backend las cambia, PATCH /reportes/{id}/estado responde 409 y el detalle se recarga (useReporteDetalle).
const TRANSICIONES: Record<ApiEstadoReporte, ApiEstadoReporte[]> = {
    Pendiente: ["Probable", "Verificado", "Resuelto", "Descartado"],
    Probable: ["Verificado", "Resuelto", "Descartado"],
    Verificado: ["Resuelto", "Descartado"],
    Resuelto: [],
    Descartado: [],
};

/** Estados a los que puede pasar un reporte desde el actual, en orden; vacío si el actual es final. */
export const estadosSiguientes = (estado: ApiEstadoReporte) => TRANSICIONES[estado];

/** Resuelto y Descartado: una vez en ellos, el estado ya no se puede cambiar. */
export const esEstadoFinal = (estado: ApiEstadoReporte) => TRANSICIONES[estado].length === 0;
