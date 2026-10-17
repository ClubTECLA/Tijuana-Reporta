import { createElement } from "react";
import type { ApiIncidente, ApiReporteResumen } from "../../types/api-types";
import { categoryIcon, categoryLabel } from "../../types/categories";

interface IncidentPinProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Incidente recién publicado: se resalta con un halo animado. */
    isNew?: boolean
}

// "Web/Pin de mapa · Regular" del Figma: color e icono de la categoría y contador de confirmaciones.
// Los pendientes (aún sin verificar) van translúcidos con borde discontinuo, como en "Mapa en vivo".
export default function IncidentPin({ reporte, incidente, isNew = false }: IncidentPinProps) {
    const color = incidente?.color ?? "#757575";
    const pending = reporte.estado_actual === "Pendiente";
    const label = `${incidente ? categoryLabel(incidente.nombre) : "Incidente"}, ${reporte.estado_actual}, ${reporte.avistamientos} confirmaciones`;

    return (
        <div role="img" aria-label={label} title={label} className="relative flex size-12 items-center justify-center">
            {isNew && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} />}
            <span
                className={`
                    relative flex size-12 items-center justify-center rounded-full border-2 border-white text-white
                    shadow-pin transition-transform duration-300
                    ${pending ? "opacity-55 outline-2 outline-offset-2 outline-dashed outline-ink-muted" : ""}
                    ${isNew ? "scale-110" : ""}
                `}
                style={{ backgroundColor: color }}
            >
                {createElement(categoryIcon(incidente?.nombre ?? ""), { className: "size-6", "aria-hidden": true })}
            </span>
            <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-white bg-ink px-1.75 py-0.5 font-['JetBrains_Mono',monospace] text-xs font-bold leading-none text-white">
                {reporte.avistamientos}
            </span>
        </div>
    );
}
