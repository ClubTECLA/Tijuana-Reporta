import { createElement } from "react";
import { LuChevronRight, LuUsers } from "react-icons/lu";
import type { ApiIncidente, ApiReporteResumen } from "../../../../types/api-types";
import { categoryIcon } from "../../../../types/categories";
import { folio } from "../../../../types/reportFormat";
import { StatusBadge } from "./Badge";

interface IncidentRowProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
    /** Abre el detalle del incidente; con él, la fila es un botón. */
    onClick?: () => void
}

// "Web/Fila de incidente" del Figma: título ("Socavón en Calle..."), dirección o coordenadas y folio,
// estado y confirmaciones. Todo es <span> porque la fila puede ser un <button>, que solo admite contenido en línea.
// El backend aún no da la hora del reporte en el listado.
export default function IncidentRow({ reporte, incidente, onClick }: IncidentRowProps) {
    const confirmations = reporte.avistamientos === 1 ? "1 confirmación" : `${reporte.avistamientos} confirmaciones`;
    // El título ya incluye la dirección cuando la hay; sin ella se muestran las coordenadas.
    const place = reporte.direccion ? "" : `${reporte.latitude.toFixed(4)}, ${reporte.longitude.toFixed(4)} · `;

    const content = <>
        <span
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: incidente?.color ?? "#757575" }}
        >
            {createElement(categoryIcon(incidente?.nombre ?? ""), { className: "size-5.5", "aria-hidden": true })}
            <span className="absolute -top-1.25 left-7.25 rounded-full border-2 border-white bg-ink px-1.5 py-0.5 font-mono text-2xs font-bold leading-none text-white">
                {reporte.avistamientos}
            </span>
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-body font-semibold text-ink">{reporte.titulo}</span>
            <span className="truncate text-caption text-ink-muted">{place}{folio(reporte.id)}</span>
            <span className="flex items-center gap-2">
                <StatusBadge estado={reporte.estado_actual} />
                <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
                    <LuUsers className="size-3.5" aria-hidden="true" />
                    {reporte.es_oficial ? "Aviso oficial" : confirmations}
                </span>
            </span>
        </span>

        <LuChevronRight className="size-4.5 shrink-0 text-ink-muted" aria-hidden="true" />
    </>;

    const style = "flex w-full items-center gap-3 rounded-[20px] bg-white py-3 pl-3 pr-3.5 text-left shadow-raised";

    return onClick
        ? <button type="button" onClick={onClick} className={`${style} transition hover:bg-brand-subtle`}>{content}</button>
        : <div className={style}>{content}</div>;
}
