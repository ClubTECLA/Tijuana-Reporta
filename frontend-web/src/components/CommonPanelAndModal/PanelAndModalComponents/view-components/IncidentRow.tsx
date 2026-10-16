import { createElement } from "react";
import { LuChevronRight, LuUsers } from "react-icons/lu";
import type { ApiEstadoReporte, ApiIncidente, ApiReporteResumen } from "../../../../types/api-types";
import { categoryIcon, categoryLabel } from "../../../../types/categories";

// "Web/Etiqueta" del Figma según el estado del reporte; los que no están aquí van en tono neutro.
const statusTones: Partial<Record<ApiEstadoReporte, string>> = {
    Pendiente: "bg-[#fff6da] text-[#b7770f]",
    Verificado: "bg-[#e7f7f0] text-[#1f8a5b]",
    Resuelto: "bg-[#e7f7f0] text-[#1f8a5b]",
};

// Folio corto derivado del id, con la misma fórmula que codigoReporte() de mobile. Solo presentación.
function folio(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 9000;
    return `INC-${hash + 1000}`;
}

interface IncidentRowProps {
    reporte: ApiReporteResumen
    incidente?: ApiIncidente
}

// "Web/Fila de incidente" del Figma. El backend aún no da título, hora ni dirección del reporte:
// se muestran la categoría, las coordenadas y las confirmaciones (avistamientos).
export default function IncidentRow({ reporte, incidente }: IncidentRowProps) {
    const title = incidente ? categoryLabel(incidente.nombre) : "Incidente";
    const confirmations = reporte.avistamientos === 1 ? "1 confirmación" : `${reporte.avistamientos} confirmaciones`;

    return (
        <div className="flex w-full items-center gap-3 rounded-[20px] bg-white py-3 pl-3 pr-3.5 shadow-[0_1px_1.5px_rgba(0,0,0,0.15)]">
            <div
                className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: incidente?.color ?? "#757575" }}
            >
                {createElement(categoryIcon(incidente?.nombre ?? ""), { className: "size-5.5", "aria-hidden": true })}
                <span className="absolute -top-1.25 left-7.25 rounded-full border-2 border-white bg-[#111827] px-1.5 py-0.5 font-['JetBrains_Mono',monospace] text-[11px] font-bold leading-none text-white">
                    {reporte.avistamientos}
                </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-semibold text-[#111827]">{title}</span>
                <span className="truncate text-[13px] text-[#64748b]">
                    {reporte.latitude.toFixed(4)}, {reporte.longitude.toFixed(4)} · {folio(reporte.id)}
                </span>
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.25 text-xs font-semibold ${statusTones[reporte.estado_actual] ?? "bg-[#e8edf3] text-[#475569]"}`}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {reporte.estado_actual}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-[#475569]">
                        <LuUsers className="size-3.5" aria-hidden="true" />
                        {reporte.es_oficial ? "Aviso oficial" : confirmations}
                    </span>
                </div>
            </div>

            <LuChevronRight className="size-4.5 shrink-0 text-[#64748b]" aria-hidden="true" />
        </div>
    );
}
