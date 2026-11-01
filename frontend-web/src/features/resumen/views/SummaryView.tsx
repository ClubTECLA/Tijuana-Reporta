import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import ColSection from "@/components/layout/ColSection";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import IncidentRow from "@/features/reportes/components/IncidentRow";
import { tabFilters } from "@/features/reportes/reportFilters";
import { useReportes } from "@/features/reportes/useReportes";
import { useAuth } from "@/features/sesion/useAuth";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { fechaDeHoy, masRecientes, saludo } from "@/features/resumen/resumen";

// Filas visibles en cada pestaña (Figma: 5).
const ROWS = 5;

const noteStyle = "py-6 text-center text-sm text-ink-muted";

function Metric({ value, label, color }: { value: number | string; label: string; color: string }) {
    return (
        <div className="flex flex-1 flex-col gap-0.5 rounded-[20px] bg-white px-3.5 py-3 shadow-raised">
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs font-medium text-ink-muted">{label}</span>
        </div>
    );
}

// "6. Mapa - MapaEnVivo" del Figma: saludo, métricas y los incidentes activos más recientes.
// Usa todos los reportes (no los filtros del panel de Incidentes), así que las cifras no cambian al filtrar.
// shortcut: sin la tarjeta "Avisos hoy" del Figma, el backend aún no tiene avisos; añadirla cuando exista el módulo.
export default function SummaryView() {
    const { user } = useAuth();
    const { openPanel } = useCommonPanel();
    const { reportes, categories, error, resetFilters } = useReportes();
    const [tab, setTab] = useState(0);

    const activos = (reportes ?? []).filter(tabFilters.activos);
    const oficiales = activos.filter((reporte) => reporte.es_oficial);
    const porRevisar = activos.filter((reporte) => reporte.estado_actual === "Pendiente").length;
    const shown = masRecientes(tab === 0 ? activos : oficiales, ROWS);

    // El enlace promete los activos: se quitan los filtros que hubiera en el panel de Incidentes.
    const openActivos = () => {
        resetFilters();
        openPanel("Incidentes");
    };

    return (
        <ColSection title={saludo(user?.username)} subtitle={fechaDeHoy()} arrangementSubsections="toUp" className="min-h-0">
            {/* Mismo ancho fijo que los demás paneles de incidentes. */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                <div className="flex gap-2.5 p-0.5">
                    <Metric value={reportes ? activos.length : "—"} label="Incidentes activos" color="text-ink" />
                    <Metric value={reportes ? porRevisar : "—"} label="Pendientes" color="text-warning" />
                </div>

                <SegmentedTabs format="row" activeTab={tab} onChange={setTab}>
                    <TabItem tabTitle="Recientes" />
                    <TabItem tabTitle="Oficiales" tabBadge={reportes ? oficiales.length : undefined} />
                </SegmentedTabs>

                {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. */}
                <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-0.5 pr-3.5 sm:-mr-4 sm:pr-4.5">
                    {error && <span className={noteStyle}>{error}</span>}
                    {!error && !reportes && <span className={noteStyle}>Cargando incidentes…</span>}
                    {reportes && shown.length === 0 &&
                        <span className={noteStyle}>{tab === 0 ? "No hay incidentes activos." : "No hay avisos oficiales activos."}</span>
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

                {activos.length > 0 &&
                    <button
                        type="button"
                        onClick={openActivos}
                        className="flex shrink-0 items-center justify-center gap-1.5 py-1.5 text-sm font-semibold text-brand-text hover:underline"
                    >
                        Ver los {activos.length} incidentes activos
                        <LuChevronRight className="size-4" aria-hidden="true" />
                    </button>
                }
            </div>
        </ColSection>
    );
}
