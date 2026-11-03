import { useEffect, useRef } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";
import { circlePolygon } from "./circlePolygon";
import { setupMapLayers } from "./mapLayers";
import { CLUSTER_MAX_ZOOM } from "./useIncidentMarkers";
import { useMap } from "./useMap";
import type { ApiIncidente, ApiReporteResumen } from "@/types/api-types";

// Radio de alerta del incidente abierto en el panel (círculo discontinuo de la pantalla 9 del Figma).
const RADIUS_SOURCE_ID = "incidente-abierto-radio";
const RADIUS_FILL_ID = "incidente-abierto-radio-relleno";
const RADIUS_LINE_ID = "incidente-abierto-radio-borde";

/**
 * Incidente cuyo detalle está abierto en el panel: el mapa lo lleva a la vista y dibuja el radio de alerta de su
 * categoría. `active` falta mientras no ha llegado o si un filtro lo oculta. Su pin lo resalta IncidentPin.
 */
export function useOpenIncident(activeId: string | null, active: ApiReporteResumen | undefined, category: ApiIncidente | undefined) {
    const { map } = useMap();
    const focusedRef = useRef<string | null>(null);
    const radiusDataRef = useRef<FeatureCollection<Polygon>>({ type: "FeatureCollection", features: [] });

    // Los pines son marcadores HTML: quedan siempre por encima de estas capas.
    useEffect(() => {
        if (!map) return;
        return setupMapLayers(map, () => {
            map.addSource(RADIUS_SOURCE_ID, { type: "geojson", data: radiusDataRef.current });
            map.addLayer({ id: RADIUS_FILL_ID, type: "fill", source: RADIUS_SOURCE_ID, paint: { "fill-color": ["get", "color"], "fill-opacity": 0.12 } });
            map.addLayer({
                id: RADIUS_LINE_ID,
                type: "line",
                source: RADIUS_SOURCE_ID,
                paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [3, 2] },
            });
        }, [RADIUS_FILL_ID, RADIUS_LINE_ID], [RADIUS_SOURCE_ID]);
    }, [map]);

    // El mapa lo lleva a la vista una vez por apertura (no en cada sondeo), con zoom suficiente para que su pin no
    // quede agrupado. Al cerrar el detalle se olvida, así que reabrirlo vuelve a llevar.
    useEffect(() => {
        if (!activeId) {
            focusedRef.current = null;
            return;
        }
        if (!map || !active || focusedRef.current === activeId) return;
        focusedRef.current = activeId;
        // Desde sm (40rem, el mismo corte que PanelChrome) el panel tapa la izquierda del mapa: se centra en el espacio
        // libre a su derecha. Por debajo lo tapa entero y no se desplaza (al cerrarlo el incidente queda en el centro).
        const panelRight = document.querySelector("[data-common-panel]")?.getBoundingClientRect().right ?? 0;
        const offsetX = window.matchMedia("(min-width: 40rem)").matches ? panelRight / 2 : 0;
        // easeTo y no flyTo: en MapLibre 6 flyTo deja el punto en el centro del mapa e ignora el offset.
        map.easeTo({
            center: [active.longitude, active.latitude],
            zoom: Math.max(map.getZoom(), CLUSTER_MAX_ZOOM + 1),
            offset: [offsetX, 0],
        });
    }, [map, activeId, active]);

    // Radio de alerta de su categoría (en metros reales), si la categoría lo tiene.
    useEffect(() => {
        radiusDataRef.current = {
            type: "FeatureCollection",
            features: active && category?.radio
                ? [{
                    type: "Feature",
                    geometry: circlePolygon(active.longitude, active.latitude, category.radio),
                    properties: { color: category.color },
                }]
                : [],
        };
        (map?.getSource(RADIUS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(radiusDataRef.current);
    }, [map, active, category]);
}
