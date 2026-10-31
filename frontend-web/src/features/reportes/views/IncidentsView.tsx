import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import ColSection from "@/components/layout/ColSection";
import CategoryChip from "@/components/ui/CategoryChip";
import IncidentRow from "@/features/reportes/components/IncidentRow";
import Button from "@/components/ui/Button";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useAuth } from "@/features/sesion/useAuth";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useReportes } from "@/features/reportes/useReportes";
import { STATUS_FILTERS, tabFilters, type ReportTab as Tab, type StatusFilter } from "@/features/reportes/reportFilters";
import { canPublishIncidents } from "@/features/sesion/users";

// Filas por tanda de "Cargar N más" (Figma: 7 filas visibles). El backend no pagina: se pagina aquí.
const PAGE_SIZE = 7;

const noteStyle = "py-6 text-center text-sm text-ink-muted";

// "19. Incidente - ListaCompleta" del Figma. Los datos y los filtros vienen de ReportesContext,
// que comparte con la capa del mapa: los chips y pestañas filtran también los pines.
export default function IncidentsView() {
    const { user } = useAuth();
    const { openPanel } = useCommonPanel();
    const { reportes, categories, error, filteredReportes: filtered, filters, setTab, toggleStatus: toggleStatusFilter, toggleOfficial: toggleOfficialFilter } = useReportes();
    const { tab, statusFilters, onlyOfficial } = filters;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const all = reportes ?? [];
    const activeCount = all.filter(tabFilters.activos).length;
    const resolvedCount = all.filter(tabFilters.resueltos).length;
    const shown = filtered.slice(0, visibleCount);
    const remaining = filtered.length - shown.length;

    // Cambiar de pestaña o de filtro vuelve a la primera tanda.
    const selectTab = (next: Tab) => { setTab(next); setVisibleCount(PAGE_SIZE) };
    const toggleStatus = (status: StatusFilter) => { toggleStatusFilter(status); setVisibleCount(PAGE_SIZE) };
    const toggleOfficial = () => { toggleOfficialFilter(); setVisibleCount(PAGE_SIZE) };

    const tabs: { key: Tab; label: string }[] = [
        { key: "activos", label: reportes ? `Activos · ${activeCount}` : "Activos" },
        { key: "resueltos", label: "Resueltos" },
        { key: "todos", label: "Todos" },
    ];

    // Mismo criterio que el dock del mapa: sin botón para el analista (solo lectura) ni para el ciudadano.
    const newButton = canPublishIncidents(user?.rol_name) &&
        <Button variant="report" size="lg" icon={<LuPlus />} title="Nuevo" onClick={() => openPanel("Nuevo Incidente")} />;

    return (
        <ColSection
            title="Incidentes"
            subtitle={reportes ? `${activeCount} activos · ${resolvedCount} resueltos` : "Cargando…"}
            headerActions={newButton}
            arrangementSubsections="toUp"
            className="min-h-0"
        >
            {/* Mismo ancho que "Nuevo incidente": ocupa el ancho mínimo del panel común (25vw menos su relleno). */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-3.5 font-ui sm:min-w-[max(25rem,calc(25vw-2rem))]">
                {/* La pestaña vive en ReportesContext (también filtra el mapa), así que las pestañas van controladas. */}
                <SegmentedTabs
                    format="row"
                    activeTab={tabs.findIndex(({ key }) => key === tab)}
                    onChange={(index) => selectTab(tabs[index].key)}
                >
                    {tabs.map(({ key, label }) => <TabItem key={key} tabTitle={label} />)}
                </SegmentedTabs>

                <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((status) =>
                        <CategoryChip
                            key={status}
                            label={status}
                            isSelected={statusFilters.includes(status)}
                            onPress={() => toggleStatus(status)}
                        />
                    )}
                    <CategoryChip label="Oficiales" isSelected={onlyOfficial} onPress={toggleOfficial} />
                </div>

                {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. */}
                <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-0.5 pr-3.5 sm:-mr-4 sm:pr-4.5">
                    {error && <span className={noteStyle}>{error}</span>}
                    {!error && !reportes && <span className={noteStyle}>Cargando incidentes…</span>}
                    {reportes && filtered.length === 0 &&
                        <span className={noteStyle}>
                            {all.length === 0 ? "Todavía no hay incidentes." : "No hay incidentes con estos filtros."}
                        </span>
                    }
                    {shown.map((reporte) =>
                        <IncidentRow
                            key={reporte.id}
                            reporte={reporte}
                            incidente={categories.get(reporte.incidente_id)}
                            onClick={() => openPanel("Detalle Incidente", { reporteId: reporte.id })}
                        />
                    )}
                </div>

                {remaining > 0 &&
                    <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="w-full shrink-0 rounded-full bg-canvas py-2 text-sm font-semibold text-ink transition-colors hover:bg-line-soft"
                    >
                        Cargar {Math.min(PAGE_SIZE, remaining)} más
                    </button>
                }
            </div>
        </ColSection>
    );
}
