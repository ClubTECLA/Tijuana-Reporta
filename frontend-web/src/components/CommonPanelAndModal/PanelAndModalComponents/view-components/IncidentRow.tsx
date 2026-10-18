import { createElement } from "react";
import { LuChevronRight, LuUsers } from "react-icons/lu";
import type { ApiIncidente, ApiReporteResumen } from "../../../../types/api-types";
import { categoryIcon, categoryLabel } from "../../../../types/categories";
import { folio } from "../../../../types/reportFormat";
import { StatusBadge } from "./Badge";

interface IncidentRowProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Abre el detalle del incidente; con él, la fila es un botón. */
    onClick?: () => void
}

// "Web/Fila de incidente" del Figma. El backend aún no da título, hora ni dirección del reporte:
// se muestran la categoría, las coordenadas y las confirmaciones (avistamientos).
export default function IncidentRow({ reporte, incidente, onClick }: IncidentRowProps) {
    const title = incidente ? categoryLabel(incidente.nombre) : "Incidente";
    const confirmations = reporte.avistamientos === 1 ? "1 confirmación" : `${reporte.avistamientos} confirmaciones`;

    const content = <>
        <div
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: incidente?.color ?? "#757575" }}
        >
            {createElement(categoryIcon(incidente?.nombre ?? ""), { className: "size-5.5", "aria-hidden": true })}
            <span className="absolute -top-1.25 left-7.25 rounded-full border-2 border-white bg-ink px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold leading-none text-white">
                {reporte.avistamientos}
            </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[15px] font-semibold text-ink">{title}</span>
            <span className="truncate text-[13px] text-ink-muted">
                {reporte.latitude.toFixed(4)}, {reporte.longitude.toFixed(4)} · {folio(reporte.id)}
            </span>
            <div className="flex items-center gap-2">
                <StatusBadge estado={reporte.estado_actual} />
                <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
                    <LuUsers className="size-3.5" aria-hidden="true" />
                    {reporte.es_oficial ? "Aviso oficial" : confirmations}
                </span>
            </div>
        </div>

        <LuChevronRight className="size-4.5 shrink-0 text-ink-muted" aria-hidden="true" />
    </>;

    const style = "flex w-full items-center gap-3 rounded-[20px] bg-white py-3 pl-3 pr-3.5 text-left shadow-raised";

    return onClick
        ? <button type="button" onClick={onClick} className={`${style} transition hover:bg-brand-subtle`}>{content}</button>
        : <div className={style}>{content}</div>;
}
