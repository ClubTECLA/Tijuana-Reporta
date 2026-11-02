import type { CSSProperties } from "react";
import { LuChevronDown } from "react-icons/lu";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { usePanelRight } from "@/panels/usePanelRight";
import type { PanelViewKey } from "@/panels/panelTypes";
import { useReportes } from "@/features/reportes/useReportes";

// Puntos de color que caben en la píldora (Figma: 4).
const MAX_DOTS = 4;
// Vistas en las que el mapa trata de incidentes; en las demás (perfil, ajustes y futuros módulos como Refugios) el
// filtro no tiene que ver con lo que se hace y la píldora no se muestra. Sin panel abierto sí se muestra.
const PANELS_WITH_INCIDENTS: PanelViewKey[] = ["Resumen", "Incidentes", "Detalle Incidente", "Nuevo Incidente", "Capas y filtros"];

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`;

// "Capas activas" del Figma ("Web/Píldora de capas"): resume lo que muestra el mapa y abre "Capas y filtros".
// Abajo a la izquierda del mapa libre; por debajo de 1680 px sube una fila para no chocar con el dock centrado.
export default function LayersPill() {
    const { currentPanelView, openPanel } = useCommonPanel();
    const { reportes, categories, categoriesLoaded, filteredReportes, filters } = useReportes();
    const panelRight = usePanelRight();

    if (!categoriesLoaded || (currentPanelView && !PANELS_WITH_INCIDENTS.includes(currentPanelView))) return null;

    const visible = [...categories.values()].filter((category) =>
        category.esta_activo && !filters.hiddenCategories.includes(category.id));

    return (
        <button
            type="button"
            onClick={() => openPanel("Capas y filtros")}
            style={{ "--panel-right": `${panelRight}px` } as CSSProperties}
            className="
                absolute bottom-24 left-4 z-10 flex items-center gap-2.5 py-2 pl-2.5 pr-4 text-left font-ui
                sm:left-[calc(var(--panel-right)+1rem)] min-[1680px]:bottom-5
                rounded-full border border-glass-line bg-glass backdrop-blur-glass drop-shadow-floating
                transition-colors hover:bg-white
            "
        >
            {!!visible.length &&
                <span aria-hidden className="flex">
                    {visible.slice(0, MAX_DOTS).map((category) =>
                        <span
                            key={category.id}
                            className="-ml-2 size-6 rounded-full border-2 border-white first:ml-0"
                            style={{ backgroundColor: category.color }}
                        />
                    )}
                </span>
            }
            <span className="flex flex-col whitespace-nowrap">
                <span className="text-caption font-bold text-ink-strong">
                    {plural(visible.length, "categoría", "categorías")}
                    {reportes && ` · ${plural(filteredReportes.length, "incidente", "incidentes")}`}
                </span>
                <span className="text-2xs font-medium text-ink-muted">Toca para filtrar</span>
            </span>
            <LuChevronDown aria-hidden className="size-4 text-ink-muted" />
        </button>
    );
}
