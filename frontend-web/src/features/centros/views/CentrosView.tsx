import { useState } from "react";
import { LuPlus } from "react-icons/lu";
import ColSection from "@/components/layout/ColSection";
import CategoryChip from "@/components/ui/CategoryChip";
import Button from "@/components/ui/Button";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useAuth } from "@/features/sesion/useAuth";
import { canManageCentros } from "@/features/sesion/users";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useCentros } from "@/features/centros/useCentros";
import { toggled } from "@/features/reportes/reportFilters";
import { estaOcupado, filterCentros, type CentroFilters, type CentroTab } from "@/features/centros/centroFormat";
import CentroRow from "@/features/centros/components/CentroRow";
import { tipoStyle } from "@/features/centros/tiposCentro";

// Filas por tanda de "Cargar N más", igual que la lista de incidentes. El backend no pagina: se pagina aquí.
const PAGE_SIZE = 5;

const noteStyle = "py-6 text-center text-sm text-ink-muted";

// "Lista los mismos centros que pinta el mapa (el filtro de CentrosContext):
// las pestañas y los chips de tipo también cambian el mapa.
export default function CentrosView() {
    const { user } = useAuth();
    const { openPanel } = useCommonPanel();
    const { centros, tipos, error, filteredCentros: filtered, filters, setFilters } = useCentros();
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const all = centros ?? [];
    const disponibles = all.filter((centro) => !estaOcupado(centro)).length;
    const shown = filtered.slice(0, visibleCount);
    const remaining = filtered.length - shown.length;

    // Cambiar el filtro vuelve a la primera tanda.
    const update = (changes: Partial<CentroFilters>) => { setFilters({ ...filters, ...changes }); setVisibleCount(PAGE_SIZE) };

    const tabs: { key: CentroTab; label: string }[] = [
        // El contador respeta los tipos elegidos, igual que la lista.
        { key: "disponibles", label: centros ? `Disponibles · ${filterCentros(all, { ...filters, tab: "disponibles" }).length}` : "Disponibles" },
        { key: "ocupados", label: "Ocupados" },
        { key: "todos", label: "Todos" },
    ];

    // Solo el administrador puede crear centros (POST /centro).
    const newButton = canManageCentros(user?.rol_name) &&
        <Button variant="mint" size="lg" icon={<LuPlus />} title="Agregar" onClick={() => openPanel("Nuevo Centro")} />;

    return (
        <ColSection
            title="Centros de ayuda"
            subtitle={centros ? `${all.length} activos · ${disponibles} disponibles` : "Cargando…"}
            headerActions={newButton}
            arrangementSubsections="toUp"
            className="min-h-0 overflow-visible"
        >
            {/* Mismo ancho fijo que el resto de paneles: con solo un mínimo, el panel (w-fit) crecería hasta el nombre
                más largo en vez de recortarlo con "…". */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-3.5 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                <SegmentedTabs
                    format="row"
                    activeTab={tabs.findIndex(({ key }) => key === filters.tab)}
                    onChange={(index) => update({ tab: tabs[index].key })}
                >
                    {tabs.map(({ key, label }) => <TabItem key={key} tabTitle={label} />)}
                </SegmentedTabs>

                {tipos.size > 0 &&
                    <div className="flex flex-wrap gap-2">
                        {[...tipos.values()].map((tipo) =>
                            <CategoryChip
                                key={tipo.id}
                                label={tipo.nombre}
                                color={tipoStyle(tipo).color}
                                isSelected={!filters.hiddenTipos.includes(tipo.id)}
                                onPress={() => update({ hiddenTipos: toggled(filters.hiddenTipos, tipo.id) })}
                            />
                        )}
                    </div>
                }

                {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. Por eso
                    ColSection va con overflow-visible: con scroll propio, ese sobrante le daría una barra horizontal. */}
                <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-0.5 pr-3.5 sm:-mr-4 sm:pr-4.5">
                    {error && <span className={noteStyle}>{error}</span>}
                    {!error && !centros && <span className={noteStyle}>Cargando centros…</span>}
                    {centros && filtered.length === 0 &&
                        <span className={noteStyle}>
                            {all.length === 0 ? "Todavía no hay centros." : "No hay centros con estos filtros."}
                        </span>
                    }
                    {shown.map((centro) =>
                        <CentroRow
                            key={centro.id}
                            centro={centro}
                            tipo={tipos.get(centro.tipo_centro)}
                            onClick={() => openPanel("Detalle Centro", { centroId: centro.id })}
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
