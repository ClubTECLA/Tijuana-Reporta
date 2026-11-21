import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import IncidentPin from "./IncidentPin";
import ClusterPin from "./ClusterPin";
import { CLUSTER_MAX_ZOOM, useIncidentMarkers } from "./useIncidentMarkers";
import { useOpenIncident } from "./useOpenIncident";
import { useMap } from "./useMap";
import { useLocationPicker } from "./useLocationPicker";
import { useReportes } from "@/features/reportes/useReportes";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { isCentroPanel } from "@/features/centros/centrosPanels";
import type { ApiReporteResumen } from "@/types/api-types";

// Sin incidentes que pintar: lista estable para no recrear la fuente en cada render.
const NO_REPORTES: ApiReporteResumen[] = [];

// Capa de incidentes del mapa. useIncidentMarkers crea y recoloca los marcadores y useOpenIncident se ocupa del
// incidente abierto en el panel; aquí se pinta el contenido de cada marcador (diseño del Figma) y se centra el
// incidente recién publicado.
export default function IncidentsLayer() {
    const { map } = useMap();
    const { searchCoordinates } = useLocationPicker();
    const { reportes, filteredReportes, categories, createdId } = useReportes();
    const { openPanel, currentPanel } = useCommonPanel();
    const flownToRef = useRef<string | null>(null);

    // Incidente cuyo detalle está abierto (desde el mapa o desde la lista): el mapa lo lleva a la vista y lo resalta.
    const activeId = currentPanel?.view === "Detalle Incidente" ? currentPanel.props.reporteId : null;
    // Se pinta aunque el filtro lo oculte (p. ej. abierto desde el Resumen): si no, el mapa se centraría en un punto vacío.
    const visibleReportes = useMemo(() => {
        if (!activeId || filteredReportes.some((reporte) => reporte.id === activeId)) return filteredReportes;
        const open = reportes?.find((reporte) => reporte.id === activeId);
        return open ? [...filteredReportes, open] : filteredReportes;
    }, [activeId, filteredReportes, reportes]);

    const reportesById = useMemo(() => new Map(visibleReportes.map((reporte) => [reporte.id, reporte])), [visibleReportes]);
    const active = activeId ? reportesById.get(activeId) : undefined;

    // Con un panel de centros abierto, el mapa muestra solo los centros (CentrosLayer), como en el Figma.
    const hidden = isCentroPanel(currentPanel?.view);
    const items = useIncidentMarkers(hidden ? NO_REPORTES : visibleReportes, categories, (reporteId) => openPanel("Detalle Incidente", { reporteId }));
    useOpenIncident(activeId, active, active ? categories.get(active.incidente_id) : undefined);

    // Incidente recién publicado: centra el mapa en él una sola vez, con zoom suficiente para ver su pin. No con un
    // panel de centros abierto: searchCoordinates movería el marcador compartido (el de "Nuevo centro"); se centra al
    // volver a mostrarse los incidentes.
    useEffect(() => {
        if (!map || hidden || !createdId || flownToRef.current === createdId) return;
        const reporte = reportesById.get(createdId);
        if (!reporte) return;
        const result = searchCoordinates(
            { latitude: reporte.latitude, longitude: reporte.longitude },
            Math.max(map.getZoom(), CLUSTER_MAX_ZOOM + 1),
        );
        if (result !== "ignored") flownToRef.current = createdId;
    }, [map, hidden, createdId, reportesById, searchCoordinates]);

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
