import { createElement } from "react";
import { folio } from "@/features/reportes/reportFormat";
import type { ApiIncidente, ApiReporteResumen } from "@/types/api-types";
import { categoryIcon } from "@/features/categorias/categories";

interface IncidentPinProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Incidente recién publicado: se resalta con un halo animado. */
    isNew?: boolean
    /** Su detalle está abierto en el panel: pin más grande con un halo de su color (pantalla 9 del Figma). */
    selected?: boolean
}

// "Web/Pin de mapa · Regular" del Figma: color e icono de la categoría y contador de confirmaciones.
// Los pendientes (aún sin verificar) van translúcidos con borde discontinuo, como en "Mapa en vivo".
// Se pinta dentro del <button> del marcador (IncidentsLayer), que abre el detalle.
export default function IncidentPin({ reporte, incidente, isNew = false, selected = false }: IncidentPinProps) {
    const color = incidente?.color ?? "#757575";
    const pending = reporte.estado_actual === "Pendiente" && !selected;
    const label = `${reporte.titulo}, ${reporte.estado_actual}, ${reporte.avistamientos} confirmaciones`;

    return (
        <span title={label} data-selected={selected || undefined} className={`relative flex items-center justify-center ${selected ? "size-16" : "size-12"}`}>
            {/* El folio distingue pines con la misma categoría, estado y confirmaciones, como en la lista. */}
            <span className="sr-only">{label}, {folio(reporte.id)}. {selected ? "Abierto en el panel" : "Ver detalle"}</span>
            {selected &&
                // Sin eventos: el halo sobresale del botón y los clics a su alrededor deben llegar al mapa.
                <span
                    className="pointer-events-none absolute left-1/2 top-1/2 size-34 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{ borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
                    aria-hidden
                />
            }
            {isNew && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: color }} aria-hidden />}
            <span
                className={`
                    relative flex size-full items-center justify-center rounded-full border-2 border-white text-white
                    shadow-pin transition-transform duration-300
                    ${pending ? "opacity-55 outline-2 outline-offset-2 outline-dashed outline-ink-muted" : ""}
                    ${isNew ? "scale-110" : ""}
                `}
                style={{ backgroundColor: color }}
                aria-hidden
            >
                {createElement(categoryIcon(incidente?.nombre ?? ""), { className: selected ? "size-8" : "size-6" })}
            </span>
            <span className="absolute -right-1.5 -top-1.5 rounded-full border-2 border-white bg-ink px-1.75 py-0.5 font-mono text-xs font-bold leading-none text-white" aria-hidden>
                {reporte.avistamientos}
            </span>
        </span>
    );
}
