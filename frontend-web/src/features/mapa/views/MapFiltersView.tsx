import { useState } from "react";
import ColSection from "@/components/layout/ColSection";
import CategoryChip from "@/components/ui/CategoryChip";
import Button from "@/components/ui/Button";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useReportes } from "@/features/reportes/useReportes";
import {
    ALL_STATUSES, DEFAULT_FILTERS, filterReportes, toggled, type MapPeriod, type ReportFilters,
} from "@/features/reportes/reportFilters";

// shortcut: falta "Rango" del Figma, que necesita un selector de fechas; añadirlo cuando el periodo se active.
const PERIODS: { key: MapPeriod; label: string }[] = [
    { key: "ahora", label: "Ahora" },
    { key: "24h", label: "24 horas" },
    { key: "7d", label: "7 días" },
];

const sectionTitleStyle = "text-xs font-semibold tracking-[0.72px] text-ink-muted";

// "7. Mapa - Filtros" del Figma. Edita el filtro que comparten el mapa y la lista de "Incidentes"; los cambios se
// aplican con "Mostrar N resultados", y regresar o cerrar los descarta. Sin la sección "Capas" del Figma: sus filas
// repetían los estados y confundían, y "Avisos oficiales" es el chip "Oficiales", igual que en la lista.
export default function MapFiltersView() {
    const { closePanel } = useCommonPanel();
    const { reportes, categories, filters, setFilters } = useReportes();
    const [draft, setDraft] = useState<ReportFilters>(filters);

    // Las activas y las desactivadas que aún tienen reportes, para poder ocultarlos también.
    const categoryList = [...categories.values()].filter((category) =>
        category.esta_activo || reportes?.some((reporte) => reporte.incidente_id === category.id));
    // El periodo necesita created_at, que el listado aún no envía: queda desactivado hasta que llegue.
    const hasDates = !!reportes?.some((reporte) => reporte.created_at);
    const count = reportes ? filterReportes(reportes, draft).length : null;

    const update = (changes: Partial<ReportFilters>) => setDraft((prev) => ({ ...prev, ...changes }));
    const apply = () => {
        setFilters(draft);
        closePanel();
    };

    return (
        <ColSection
            title="Filtros del mapa"
            subtitle="Elige qué se muestra en el mapa"
            arrangementSubsections="toUp"
            className="min-h-0"
        >
            {/* Mismo ancho fijo que el resto de paneles; el scroll llega al borde y el pie queda abajo, como en el Figma. */}
            <div className="flex min-h-0 w-full flex-1 flex-col font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pb-5 pr-3 sm:-mr-4 sm:pr-4">
                    <span className={sectionTitleStyle}>CATEGORÍAS</span>
                    <div className="flex flex-wrap gap-2">
                        {categoryList.map((category) =>
                            <CategoryChip
                                key={category.id}
                                label={category.etiqueta}
                                color={category.color}
                                isSelected={!draft.hiddenCategories.includes(category.id)}
                                onPress={() => update({ hiddenCategories: toggled(draft.hiddenCategories, category.id) })}
                            />
                        )}
                    </div>

                    <span className={sectionTitleStyle}>ESTADO</span>
                    <div className="flex flex-wrap gap-2">
                        {ALL_STATUSES.map((status) =>
                            <CategoryChip
                                key={status}
                                label={status}
                                color="var(--color-brand)"
                                isSelected={draft.statuses.includes(status)}
                                onPress={() => update({ statuses: toggled(draft.statuses, status) })}
                            />
                        )}
                        <CategoryChip
                            label="Oficiales"
                            color="var(--color-brand)"
                            isSelected={draft.onlyOfficial}
                            onPress={() => update({ onlyOfficial: !draft.onlyOfficial })}
                        />
                    </div>

                    <span className={sectionTitleStyle}>PERIODO</span>
                    {/* fieldset desactiva de una vez todos los botones de las pestañas. */}
                    <fieldset disabled={!hasDates} className="flex min-w-0 flex-col gap-1.5 disabled:opacity-60">
                        <legend className="sr-only">Periodo</legend>
                        <SegmentedTabs
                            format="row"
                            activeTab={PERIODS.findIndex(({ key }) => key === draft.period)}
                            onChange={(index) => update({ period: PERIODS[index].key })}
                        >
                            {PERIODS.map(({ key, label }) => <TabItem key={key} tabTitle={label} />)}
                        </SegmentedTabs>
                        {!hasDates && <span className="text-xs text-ink-muted">Disponible cuando los reportes incluyan su fecha.</span>}
                    </fieldset>
                </div>

                <div className="flex gap-2.5 border-t border-line pt-3.5">
                    <Button variant="subtle" size="lg" title="Restablecer" onClick={() => setDraft(DEFAULT_FILTERS)} className="flex-1" />
                    <Button
                        variant="primary"
                        size="lg"
                        title={count === null ? "Mostrar resultados" : `Mostrar ${count} ${count === 1 ? "resultado" : "resultados"}`}
                        onClick={apply}
                        className="flex-1 drop-shadow-button-brand"
                    />
                </div>
            </div>
        </ColSection>
    );
}
