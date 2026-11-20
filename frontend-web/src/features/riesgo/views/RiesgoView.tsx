import { useEffect, useState } from "react";
import { LuDownload, LuInfo, LuMap } from "react-icons/lu";
import ColSection from "@/components/layout/ColSection";
import Button from "@/components/ui/Button";
import { SegmentedTabs, TabItem } from "@/components/ui/SegmentedTabs";
import { useReportes } from "@/features/reportes/useReportes";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useRiesgo } from "../useRiesgo";
import { barrasCategorias, formatCount, subtituloModelo } from "../riesgo";
import RiesgoRow from "../components/RiesgoRow";

const sectionTitleStyle = "text-xs font-semibold tracking-[0.72px] text-ink-muted";
const noteStyle = "py-6 text-center text-sm text-ink-muted";
const listStyle = "flex shrink-0 flex-col divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white";

function Metric({ value, label, color }: { value: string; label: string; color: string }) {
    return (
        <div className="flex flex-1 flex-col items-center gap-0.5 rounded-[20px] bg-white px-3.5 py-3 shadow-raised">
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs font-medium text-ink-muted">{label}</span>
        </div>
    );
}

// "28. Riesgo - RiesgoHistorico" del Figma: zonas de riesgo estimadas y colonias con más incidentes, a partir de
// los reportes históricos. El mapa (RiesgoLayer) muestra a la vez el calor y las zonas.
// shortcut: sin "Exportar", filtros ni el detalle de zona del Figma; quedan para cuando existan en el backend.
export default function RiesgoView() {
    const { resumen, error, enfocarZona, setPanelAbierto, verEnMapa } = useRiesgo();
    const { closePanel } = useCommonPanel();
    const { categories } = useReportes();
    const [tab, setTab] = useState(0);
    // El subtítulo dice "hoy 14:20": se recalcula cada minuto por si el panel queda abierto al cambiar de día.
    const [now, setNow] = useState(Date.now);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);

    // Mientras el panel está abierto el mapa muestra el riesgo. Al cerrarlo se olvida la zona elegida, para que al
    // volver no salte el mapa.
    useEffect(() => {
        setPanelAbierto(true);
        return () => {
            setPanelAbierto(false);
            enfocarZona(null);
        };
    }, [setPanelAbierto, enfocarZona]);

    const barras = resumen ? barrasCategorias(resumen.categorias, categories) : [];
    const vacio = resumen?.total_historicos === 0;

    return (
        <ColSection
            title="Riesgo e histórico"
            subtitle={resumen ? subtituloModelo(resumen.generado_en, resumen.version_modelo, now) : "Cargando modelo…"}
            headerActions={<>
                <Button size="md" variant="subtle" icon={<LuDownload />} ariaLabel="Exportar" tooltip="Exportar (próximamente)" disabled className="sm:hidden" />
                <Button size="md" variant="subtle" icon={<LuDownload />} title="Exportar" disabled tooltip="Próximamente" className="max-sm:hidden" />
            </>}
            arrangementSubsections="toDown"
            className="min-h-0"
        >
            {/* Mismo ancho fijo que los demás paneles. */}
            <div className="flex min-h-0 w-full flex-1 flex-col gap-4 font-ui sm:w-[max(25rem,calc(25vw-2rem))]">
                {/* En teléfono el panel tapa el mapa entero: se cierra y el riesgo sigue en el mapa (modo mapa). */}
                <Button
                    size="md"
                    variant="primary"
                    icon={<LuMap />}
                    title="Ver en el mapa"
                    className="w-full justify-center sm:hidden"
                    onClick={() => { verEnMapa(); closePanel() }}
                />

                <SegmentedTabs format="row" activeTab={tab} onChange={setTab}>
                    <TabItem tabTitle="Zonas" />
                    <TabItem tabTitle="Histórico" />
                </SegmentedTabs>

                <div className="flex gap-2.5 p-0.5">
                    <Metric value={resumen ? formatCount(resumen.zonas_alto_riesgo) : "—"} label="Zonas alto riesgo" color="text-danger" />
                    <Metric value={resumen ? formatCount(resumen.total_historicos) : "—"} label="Históricos" color="text-ink" />
                </div>

                {/* Requerimiento +6: el riesgo es una estimación, no un incidente confirmado. */}
                <p className="flex gap-2 rounded-2xl bg-brand-subtle px-4 py-3 text-caption text-brand-text">
                    <LuInfo className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                        <span className="font-semibold">Estimación del sistema.</span> Las zonas salen de los reportes
                        históricos cercanos entre sí; no son incidentes confirmados.
                    </span>
                </p>

                {/* El scroll se extiende sobre el relleno del panel para quedar pegado a su borde derecho. */}
                <div className="-mr-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-0.5 pb-4 pr-3.5 sm:-mr-4 sm:pr-4.5">
                    {error && <span className={noteStyle}>{error}</span>}
                    {!error && !resumen && <span className={noteStyle}>Cargando riesgo…</span>}
                    {vacio &&
                        <span className={noteStyle}>
                            Todavía no hay reportes históricos. Un reporte cuenta para el riesgo cuando un rol oficial lo pasa a histórico desde su detalle.
                        </span>
                    }

                    {resumen && !vacio && tab === 0 && <>
                        <h3 className={sectionTitleStyle}>ZONAS CON MAYOR RIESGO</h3>
                        {resumen.zonas.length
                            ? <div className={listStyle}>
                                {resumen.zonas.map((zona, index) =>
                                    <RiesgoRow
                                        key={`${zona.latitude},${zona.longitude}`}
                                        posicion={index + 1}
                                        nombre={zona.nombre}
                                        score={zona.score}
                                        nivel={zona.nivel}
                                        detalle={`${zona.reportes} reportes históricos. Centrar en el mapa.`}
                                        onClick={() => enfocarZona(zona)}
                                    />
                                )}
                            </div>
                            : <span className="text-caption text-ink-muted">Los reportes históricos aún están dispersos: ninguna zona los agrupa.</span>
                        }
                    </>}

                    {resumen && !vacio && tab === 1 && <>
                        <h3 className={sectionTitleStyle}>COLONIAS CON MÁS INCIDENTES</h3>
                        {resumen.colonias.length
                            ? <div className={listStyle}>
                                {resumen.colonias.map((colonia, index) =>
                                    <RiesgoRow
                                        key={colonia.nombre}
                                        posicion={index + 1}
                                        nombre={colonia.nombre}
                                        score={colonia.score}
                                        nivel={colonia.nivel}
                                        detalle={`${colonia.reportes} reportes históricos`}
                                    />
                                )}
                            </div>
                            : <span className="text-caption text-ink-muted">Los reportes históricos no tienen colonia en su dirección.</span>
                        }
                    </>}

                    {resumen && !vacio && <>
                        <h3 className={`${sectionTitleStyle} pt-1`}>INCIDENTES POR CATEGORÍA</h3>
                        <ul className="flex shrink-0 flex-col gap-2">
                            {barras.map((barra) =>
                                <li key={barra.id} className="flex items-center gap-3 text-xs">
                                    <span className="w-24 shrink-0 truncate text-ink-secondary">{barra.nombre}</span>
                                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas" aria-hidden>
                                        <span className="block h-full rounded-full" style={{ width: `${Math.max(2, barra.ratio * 100)}%`, backgroundColor: barra.color }} />
                                    </span>
                                    <span className="w-10 shrink-0 text-right font-mono font-semibold text-ink">{formatCount(barra.total)}</span>
                                </li>
                            )}
                        </ul>
                    </>}
                </div>
            </div>
        </ColSection>
    );
}
