import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import IncidentPin from "./IncidentPin";
import ClusterPin from "./ClusterPin";
import { CLUSTER_MAX_ZOOM, useIncidentMarkers } from "./useIncidentMarkers";
import { useOpenIncident } from "./useOpenIncident";
import { useMap } from "./useMap";
import { useReportes } from "@/features/reportes/useReportes";
import { useCommonPanel } from "@/panels/useCommonPanel";

// Capa de incidentes del mapa. useIncidentMarkers crea y recoloca los marcadores y useOpenIncident se ocupa del
// incidente abierto en el panel; aquí se pinta el contenido de cada marcador (diseño del Figma) y se centra el
// incidente recién publicado.
export default function IncidentsLayer() {
    const { map } = useMap();
    const { filteredReportes, categories, createdId } = useReportes();
    const { openPanel, currentPanel } = useCommonPanel();
    const flownToRef = useRef<string | null>(null);

    const reportesById = useMemo(() => new Map(filteredReportes.map((reporte) => [reporte.id, reporte])), [filteredReportes]);
    // Incidente cuyo detalle está abierto (desde el mapa o desde la lista): el mapa lo lleva a la vista y lo resalta.
    const activeId = currentPanel?.view === "Detalle Incidente" ? currentPanel.props.reporteId : null;
    const active = activeId ? reportesById.get(activeId) : undefined;

    const items = useIncidentMarkers(filteredReportes, categories, (reporteId) => openPanel("Detalle Incidente", { reporteId }));
    useOpenIncident(activeId, active, active ? categories.get(active.incidente_id) : undefined);

    // Incidente recién publicado: centra el mapa en él una sola vez, con zoom suficiente para ver su pin.
    useEffect(() => {
        if (!map || !createdId || flownToRef.current === createdId) return;
        const reporte = reportesById.get(createdId);
        if (!reporte) return;
        flownToRef.current = createdId;
        map.flyTo({ center: [reporte.longitude, reporte.latitude], zoom: Math.max(map.getZoom(), CLUSTER_MAX_ZOOM + 1) });
    }, [map, createdId, reportesById]);

    return (
        <>
            {items.map((item) => {
                if (item.kind === "cluster") {
                    return createPortal(
                        <ClusterPin
                            count={item.count}
                            segments={item.categoryCounts.map(([id, value]) => ({ id, color: categories.get(id)?.color ?? "#757575", value }))}
                        />,
                        item.element,
                        item.key,
                    );
                }
                const reporte = reportesById.get(item.reporteId);
                if (!reporte) return null; // filtrado mientras llega la siguiente sincronización
                return createPortal(
                    <IncidentPin
                        reporte={reporte}
                        incidente={categories.get(reporte.incidente_id)}
                        isNew={reporte.id === createdId}
                        selected={reporte.id === activeId}
                    />,
                    item.element,
                    item.key,
                );
            })}
        </>
    );
}
