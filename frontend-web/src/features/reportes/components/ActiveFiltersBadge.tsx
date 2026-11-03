import type { CSSProperties } from "react";
import { LuFilter, LuX } from "react-icons/lu";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { usePanelRight } from "@/panels/usePanelRight";
import { useReportes } from "@/features/reportes/useReportes";
import { activeFilterLabels } from "@/features/reportes/reportFilters";

// Aviso sobre el mapa de que los pines están filtrados: el filtro sigue aplicándose al cerrar los paneles. Con el estilo
// de "Capas activas" del Figma, centrado encima del dock y en su mismo eje (el mapa libre a la derecha del panel). Por
// debajo de 1680 px la píldora de capas ocupa la fila de encima del dock, así que el aviso sube una más.
// No se muestra sin filtros ni con los paneles que ya enseñan el filtro ("Incidentes" y "Capas y filtros").
const PANELS_SHOWING_FILTERS = ["Incidentes", "Capas y filtros"];

export default function ActiveFiltersBadge() {
    const { currentPanelView, openPanel } = useCommonPanel();
    const { reportes, filteredReportes, filters, resetFilters } = useReportes();
    const panelRight = usePanelRight();
    const labels = activeFilterLabels(filters);

    if (!reportes || !labels.length || PANELS_SHOWING_FILTERS.includes(currentPanelView ?? "")) return null;

    return (
        <div
            style={{ "--panel-right": `${panelRight}px` } as CSSProperties}
            className="
                absolute bottom-40 left-1/2 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1
                sm:left-[calc(var(--panel-right)+(100%-var(--panel-right))/2)] sm:max-w-[calc(100%-var(--panel-right)-2rem)]
                min-[1680px]:bottom-24
                rounded-full border border-glass-line bg-glass p-1.5 font-ui backdrop-blur-glass drop-shadow-floating
            "
        >
            <button
                type="button"
                onClick={() => openPanel("Capas y filtros")}
                title="Ver o cambiar los filtros"
                className="flex min-w-0 items-center gap-2.5 rounded-full py-0.5 pl-0.5 pr-2 text-left transition-colors hover:bg-subtle"
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden>
                    <LuFilter className="size-4.5" />
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">Filtro activo: {labels.join(" · ")}</span>
                    {/* role="status": al cambiar el filtro o llegar datos nuevos, el lector de pantalla lee el nuevo total. */}
                    <span role="status" className="truncate text-xs text-ink-muted">
                        El mapa muestra {filteredReportes.length} de {reportes.length} incidentes
                    </span>
                </span>
            </button>
            <button
                type="button"
                onClick={resetFilters}
                aria-label="Quitar filtros"
                title="Quitar filtros"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-icon transition-colors hover:bg-subtle"
            >
                <LuX className="size-4.5" />
            </button>
        </div>
    );
}
