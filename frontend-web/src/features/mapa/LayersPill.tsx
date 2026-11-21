import { useSyncExternalStore, type CSSProperties } from "react";
import { LuChevronDown } from "react-icons/lu";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { usePanelRight } from "@/panels/usePanelRight";
import type { PanelViewKey } from "@/panels/panelTypes";
import { useReportes } from "@/features/reportes/useReportes";

// Puntos de color que caben en la píldora (Figma: 4).
const MAX_DOTS = 4;
// Vistas en las que el mapa trata de incidentes; en las demás (perfil, ajustes, centros) el
// filtro no tiene que ver con lo que se hace y la píldora no se muestra. Sin panel abierto sí se muestra.
const PANELS_WITH_INCIDENTS: PanelViewKey[] = ["Resumen", "Incidentes", "Detalle Incidente", "Nuevo Incidente", "Capas y filtros"];

// Mapa libre mínimo para que la píldora (hasta ~330 px, con 16 de margen) quepa a la izquierda del dock centrado
// (~450 px) sin tocarlo: 2 × (330 + 2 × 16) + 450.
const MIN_FREE_WIDTH = 1180;

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count === 1 ? singular : pluralForm}`;

const subscribeToResize = (onChange: () => void) => {
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
};
const windowWidth = () => window.innerWidth;

// "Capas activas" del Figma ("Web/Píldora de capas"): resume lo que muestra el mapa y abre "Capas y filtros".
// Abajo a la izquierda del mapa libre, en la fila del dock. Si no cabe junto a él (teléfono, tablet o un portátil con el
// panel abierto) no se muestra, en vez de subir una fila y escalonarse con el dock y el aviso de filtro: queda el
// botón de capas de los controles del mapa, que abre el mismo panel.
export default function LayersPill() {
    const { currentPanelView, openPanel } = useCommonPanel();
    const { reportes, categories, categoriesLoaded, filteredReportes, filters } = useReportes();
    const panelRight = usePanelRight();
    const width = useSyncExternalStore(subscribeToResize, windowWidth);

    if (!categoriesLoaded || (currentPanelView && !PANELS_WITH_INCIDENTS.includes(currentPanelView))) return null;
    if (width - panelRight < MIN_FREE_WIDTH) return null;

    const visible = [...categories.values()].filter((category) =>
        category.esta_activo && !filters.hiddenCategories.includes(category.id));

    return (
        <button
            type="button"
            onClick={() => openPanel("Capas y filtros")}
            style={{ "--panel-right": `${panelRight}px` } as CSSProperties}
            className="
                absolute bottom-5 left-4 z-10 flex max-w-[calc(100%-2rem)] items-center gap-2.5 py-2 pl-2.5 pr-4 text-left font-ui
                sm:left-[calc(var(--panel-right)+1rem)] sm:max-w-[calc(100%-var(--panel-right)-2rem)]
                rounded-full border border-glass-line bg-glass backdrop-blur-glass drop-shadow-floating
                transition-colors hover:bg-white
            "
        >
            {!!visible.length &&
                <span aria-hidden className="flex shrink-0">
                    {visible.slice(0, MAX_DOTS).map((category) =>
                        <span
                            key={category.id}
                            className="-ml-2 size-6 rounded-full border-2 border-white first:ml-0"
                            style={{ backgroundColor: category.color }}
                        />
                    )}
                </span>
            }
            {/* Sin pasar del mapa libre: si no cabe, el texto se recorta con "…". */}
            <span className="flex min-w-0 flex-col whitespace-nowrap">
                <span className="truncate text-caption font-bold text-ink-strong">
                    {plural(visible.length, "categoría", "categorías")}
                    {reportes && ` · ${plural(filteredReportes.length, "incidente", "incidentes")}`}
                </span>
                <span className="truncate text-2xs font-medium text-ink-muted">Toca para filtrar</span>
            </span>
            <LuChevronDown aria-hidden className="size-4 shrink-0 text-ink-muted" />
        </button>
    );
}
