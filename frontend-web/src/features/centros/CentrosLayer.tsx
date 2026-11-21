import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Marker } from "maplibre-gl";
import type { ApiCentro } from "@/types/api-types";
import { useMap } from "@/features/mapa/useMap";
import { freeMapCenter } from "@/features/mapa/freeMapCenter";
import { CLUSTER_MAX_ZOOM } from "@/features/mapa/useIncidentMarkers";
import { useCommonPanel } from "@/panels/useCommonPanel";
import { useCentros } from "./useCentros";
import { isCentroPanel, isIncidentPanel } from "./centrosPanels";
import CentroPin from "./components/CentroPin";

// Sin centros que pintar: lista estable para no recrear los marcadores en cada render.
const NO_CENTROS: ApiCentro[] = [];

// Los clics sobre un pin no deben llegar al mapa (p. ej. mover el marcador de "Nuevo centro").
const stopMapEvent = (event: Event) => event.stopPropagation();

/**
 * Un marcador de MapLibre por centro, con el elemento donde quien lo usa pinta el pin con un portal. Sin agrupar,
 * a diferencia de los incidentes: los centros son pocos.
 */
function useCentroMarkers(centros: ApiCentro[], onOpenDetail: (centroId: string) => void) {
    const { map } = useMap();
    const [items, setItems] = useState<{ id: string; element: HTMLButtonElement }[]>([]);
    const markersRef = useRef(new Map<string, { marker: Marker; element: HTMLButtonElement }>());
    // Los listeners se crean una vez; la ref les da siempre el onOpenDetail actual.
    const onOpenDetailRef = useRef(onOpenDetail);
    useEffect(() => {
        onOpenDetailRef.current = onOpenDetail;
    });

    useEffect(() => {
        if (!map) return;
        const markers = markersRef.current;
        const ids = new Set(centros.map((centro) => centro.id));
        for (const [id, { marker }] of markers) {
            if (!ids.has(id)) {
                marker.remove();
                markers.delete(id);
            }
        }
        for (const centro of centros) {
            const lngLat: [number, number] = [centro.longitude, centro.latitude];
            const entry = markers.get(centro.id);
            if (entry) {
                entry.marker.setLngLat(lngLat);
                continue;
            }
            // Botón y no div: el pin se enfoca con Tab y se abre con Enter o espacio; el nombre lo pone el texto sr-only.
            const element = document.createElement("button");
            element.type = "button";
            element.className = "cursor-pointer rounded-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand has-[[data-selected]]:z-1";
            element.addEventListener("mousedown", stopMapEvent);
            element.addEventListener("click", (event) => {
                event.stopPropagation();
                onOpenDetailRef.current(centro.id);
            });
            markers.set(centro.id, { marker: new Marker({ element }).setLngLat(lngLat).addTo(map), element });
            // Justo encima del lienzo, antes que los marcadores de incidentes: compartiendo mapa, los incidentes tapan
            // a los centros y no al revés (el orden de los hermanos decide quién queda encima).
            map.getCanvas().after(element);
        }
        // En el siguiente fotograma, como useIncidentMarkers: no se cambia el estado dentro del cuerpo del efecto.
        const frameId = requestAnimationFrame(() =>
            setItems(centros.map((centro) => ({ id: centro.id, element: markers.get(centro.id)!.element }))));
        return () => cancelAnimationFrame(frameId);
    }, [map, centros]);

    // Como useIncidentMarkers: solo los pines dentro de la vista entran en el orden de Tab. Se recalcula al terminar de
    // mover el mapa, al cambiar su tamaño y cuando cambian los centros (el efecto de arriba ya creó sus marcadores).
    useEffect(() => {
        if (!map) return;
        const updateTabIndex = () => {
            const { clientWidth: width, clientHeight: height } = map.getContainer();
            for (const { marker, element } of markersRef.current.values()) {
                const { x, y } = map.project(marker.getLngLat());
                element.tabIndex = x >= 0 && y >= 0 && x <= width && y <= height ? 0 : -1;
            }
        };
        updateTabIndex();
        map.on("moveend", updateTabIndex);
        map.on("resize", updateTabIndex);
        return () => {
            map.off("moveend", updateTabIndex);
            map.off("resize", updateTabIndex);
        };
    }, [map, centros]);

    // Al cambiar de mapa o desmontar, fuera todos los marcadores.
    useEffect(() => {
        const markers = markersRef.current;
        return () => {
            for (const { marker } of markers.values()) marker.remove();
            markers.clear();
        };
    }, [map]);

    return items;
}

// Capa de centros del mapa: siempre, salvo con un panel de incidentes abierto. Dentro del módulo de centros pinta los
// del filtro de la lista (y los incidentes se ocultan, ver IncidentsLayer); fuera, todos los activos. Lleva a la vista
// el que tiene el detalle abierto.
export default function CentrosLayer() {
    const { map } = useMap();
    const { currentPanel, openPanel } = useCommonPanel();
    const { centros, tipos, filteredCentros } = useCentros();
    const focusedRef = useRef<string | null>(null);

    const hidden = isIncidentPanel(currentPanel?.view);
    const filtered = isCentroPanel(currentPanel?.view);
    const activeId = currentPanel?.view === "Detalle Centro" ? currentPanel.props.centroId : null;

    // El abierto se pinta aunque el filtro lo oculte; si no, el mapa se centraría en un punto vacío.
    const shown = useMemo(() => {
        if (hidden || !centros) return NO_CENTROS;
        if (!filtered) return centros;
        if (!activeId || filteredCentros.some((centro) => centro.id === activeId)) return filteredCentros;
        const open = centros.find((centro) => centro.id === activeId);
        return open ? [...filteredCentros, open] : filteredCentros;
    }, [hidden, filtered, activeId, filteredCentros, centros]);
    const active = activeId ? shown.find((centro) => centro.id === activeId) : undefined;

    const items = useCentroMarkers(shown, (centroId) => openPanel("Detalle Centro", { centroId }));

    // Una vez por apertura, como useOpenIncident: centra el centro en el mapa libre, entre el panel y los controles.
    useEffect(() => {
        if (!activeId) {
            focusedRef.current = null;
            return;
        }
        if (!map || !active || focusedRef.current === activeId) return;
        focusedRef.current = activeId;
        // easeTo y no flyTo: en MapLibre 6 flyTo ignora el offset.
        map.easeTo({
            center: [active.longitude, active.latitude],
            zoom: Math.max(map.getZoom(), CLUSTER_MAX_ZOOM + 1),
            offset: [freeMapCenter(map)[0] - map.getContainer().getBoundingClientRect().width / 2, 0],
        });
    }, [map, activeId, active]);

    const byId = useMemo(() => new Map(shown.map((centro) => [centro.id, centro])), [shown]);

    return (
        <>
            {items.map(({ id, element }) => {
                const centro = byId.get(id);
                if (!centro) return null; // quitado mientras llega el siguiente fotograma
                return createPortal(
                    <CentroPin centro={centro} tipo={tipos.get(centro.tipo_centro)} selected={id === activeId} />,
                    element,
                    id,
                );
            })}
        </>
    );
}
