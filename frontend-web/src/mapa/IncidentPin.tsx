import { createElement } from "react";
import { folio } from "../reportes/reportFormat";
import type { ApiIncidente, ApiReporteResumen } from "../types/api-types";
import { categoryIcon, categoryLabel } from "../reportes/categories";

interface IncidentPinProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Incidente recién publicado: se resalta con un halo animado. */
    isNew?: boolean
}

// "Web/Pin de mapa · Regular" del Figma: color e icono de la categoría y contador de confirmaciones.
// Los pendientes (aún sin verificar) van translúcidos con borde discontinuo, como en "Mapa en vivo".
// Se pinta dentro del <button> del marcador (IncidentsLayer), que abre el detalle.
export default function IncidentPin({ reporte, incidente, isNew = false }: IncidentPinProps) {
    const color = incidente?.color ?? "#757575";
    const pending = reporte.estado_actual === "Pendiente";
    const label = `${incidente ? categoryLabel(incidente.nombre) : "Incidente"}, ${reporte.estado_actual}, ${reporte.avistamientos} confirmaciones`;

    return (
        <span title={label} className="relative flex size-12 items-center justify-center">
            {/* El folio distingue pines con la misma categoría, estado y confirmaciones, como en la lista. */}
            <span className="sr-only">{label}, {folio(reporte.id)}. Ver detalle</span>
            {isNew && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} aria-hidden />}
            <span
                className={`
                    relative flex size-12 items-center justify-center rounded-full border-2 border-white text-white
                    shadow-pin transition-transform duration-300
                    ${pending ? "opacity-55 outline-2 outline-offset-2 outline-dashed outline-ink-muted" : ""}
                    ${isNew ? "scale-110" : ""}
                `}
                style={{ backgroundColor: color }}
                aria-hidden
            >
                {createElement(categoryIcon(incidente?.nombre ?? ""), { className: "size-6" })}
            </span>
            <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-white bg-ink px-1.75 py-0.5 font-mono text-xs font-bold leading-none text-white" aria-hidden>
                {reporte.avistamientos}
            </span>
        </span>
    );
}
