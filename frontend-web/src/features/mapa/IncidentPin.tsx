import { createElement } from "react";
import type { IconType } from "react-icons";
import { LuCheck, LuX } from "react-icons/lu";
import { confirmaciones, folio, incidentBorderColor, incidentColor, incidentIconColor, PENDING_ICON_STYLE } from "@/features/reportes/reportFormat";
import type { ApiEstadoReporte, ApiIncidente, ApiReporteResumen } from "@/types/api-types";
import { categoryIcon } from "@/features/categorias/categories";

// En un incidente cerrado, la burbuja del contador indica cómo terminó, con el color del pin: el estado no depende solo del color.
const CLOSED_ICONS: Partial<Record<ApiEstadoReporte, IconType>> = { Resuelto: LuCheck, Descartado: LuX };

interface IncidentPinProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Incidente recién publicado: se resalta con un halo animado. */
    isNew?: boolean
    /** Su detalle está abierto en el panel: pin más grande con un halo de su color (pantalla 9 del Figma). */
    selected?: boolean
}

// "Web/Pin de mapa · Regular" del Figma: color e icono de la categoría y contador de confirmaciones.
// Los pendientes (aún sin verificar) van translúcidos con borde discontinuo, como en "Mapa en vivo"; los demás estados se distinguen con incidentColor e incidentBorderColor.
// Se pinta dentro del <button> del marcador (IncidentsLayer), que abre el detalle.
export default function IncidentPin({ reporte, incidente, isNew = false, selected = false }: IncidentPinProps) {
    const color = incidentColor(reporte.estado_actual, incidente?.color);
    const pending = reporte.estado_actual === "Pendiente" && !selected;
    const ClosedIcon = CLOSED_ICONS[reporte.estado_actual];
    const label = `${reporte.titulo}, ${reporte.estado_actual}, ${confirmaciones(reporte.avistamientos)}`;

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
                    ${pending ? `opacity-55 ${PENDING_ICON_STYLE}` : ""}
                    ${isNew ? "scale-110" : ""}
                `}
                style={{ backgroundColor: color, borderColor: incidentBorderColor(reporte.estado_actual), color: incidentIconColor(reporte.estado_actual, incidente?.color) }}
                aria-hidden
            >
                {createElement(categoryIcon(incidente?.nombre ?? ""), { className: selected ? "size-8" : "size-6" })}
            </span>
            <span
                className={`absolute -right-1.5 -top-1.5 rounded-full border-2 border-white bg-ink font-mono text-xs font-bold leading-none text-white ${ClosedIcon ? "p-0.5" : "px-1.75 py-0.5"}`}
                style={ClosedIcon && { backgroundColor: color, borderColor: incidentBorderColor(reporte.estado_actual), color: incidentIconColor(reporte.estado_actual) }}
                aria-hidden
            >
                {ClosedIcon ? <ClosedIcon className="block size-3" strokeWidth={3} /> : reporte.avistamientos}
            </span>
        </span>
    );
}
