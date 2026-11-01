import { LuFilter, LuX } from "react-icons/lu";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useReportes } from "@/features/reportes/useReportes";
import { activeFilterLabels } from "@/features/reportes/reportFilters";

// Aviso sobre el mapa de que los pines están filtrados: los filtros del panel "Incidentes" siguen aplicándose al
// cerrarlo. Con el estilo de "Capas activas" del Figma, pero arriba al centro: abajo a la izquierda lo taparía el panel
// y chocaría con "Nuevo incidente" en pantallas de 1280 a 1440 px.
// No se muestra sin filtros ni con el panel "Incidentes" abierto, que ya enseña sus chips.
export default function ActiveFiltersBadge() {
    const { currentPanelView, openPanel } = useCommonPanel();
    const { reportes, filteredReportes, filters, resetFilters } = useReportes();
    const labels = activeFilterLabels(filters);

    if (!reportes || !labels.length || currentPanelView === "Incidentes") return null;

    return (
        <div
            className="
                absolute left-1/2 top-20 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1
                rounded-full border border-glass-line bg-glass p-1.5 font-ui backdrop-blur-glass drop-shadow-floating
            "
        >
            <button
                type="button"
                onClick={() => openPanel("Incidentes")}
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
