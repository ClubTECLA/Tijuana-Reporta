import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Marker, type GeoJSONSource, type MapSourceDataEvent } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import IncidentPin from "./IncidentPin";
import ClusterPin from "./ClusterPin";
import { useMap } from "../../hooks/useMap";
import { useReportes } from "../../hooks/useReportes";
import { useCommonPanel } from "../../hooks/useCommonPanel";
import type { ApiReporteResumen } from "../../types/api-types";

// Capa de incidentes del mapa (opción híbrida):
// - Los puntos van en una fuente GeoJSON con clustering; MapLibre agrupa en su web worker (supercluster),
//   así que agrupar miles de puntos no bloquea la interfaz.
// - Solo los puntos y grupos VISIBLES se dibujan como marcadores HTML con React (diseño del Figma).
//   Los marcadores se reutilizan por clave entre actualizaciones: solo se crean los que entran y se quitan
//   los que salen, y se recalculan cuando el mapa queda quieto (idle/moveend), no en cada fotograma.
const SOURCE_ID = "incidentes";
// Capa invisible: MapLibre solo carga los tiles de una fuente si alguna capa la usa (necesario para querySourceFeatures).
const LOAD_LAYER_ID = "incidentes-carga";
// Zoom a partir del cual ya no se agrupa: al centrar un incidente nuevo se usa un zoom mayor para que se vea su pin.
const CLUSTER_MAX_ZOOM = 14;

type MarkerItem =
    | { key: string; kind: "point"; element: HTMLButtonElement; reporteId: string }
    | { key: string; kind: "cluster"; element: HTMLButtonElement; count: number; categoryCounts: [number, number][] };

function toFeatureCollection(reportes: ApiReporteResumen[]): FeatureCollection<Point> {
    return {
        type: "FeatureCollection",
        features: reportes.map((reporte) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [reporte.longitude, reporte.latitude] },
            properties: { id: reporte.id, incidente_id: reporte.incidente_id },
        })),
    };
}

// Los clics sobre un pin no deben llegar al mapa (p. ej. mover el marcador de "Nuevo incidente").
const stopMapEvent = (event: Event) => event.stopPropagation();

export default function IncidentsLayer() {
    const { map } = useMap();
    const { filteredReportes, categories, createdId } = useReportes();
    const { setPanelView } = useCommonPanel();
    const [items, setItems] = useState<MarkerItem[]>([]);

    const markersRef = useRef(new Map<string, { marker: Marker; element: HTMLButtonElement }>());
    const dataRef = useRef<FeatureCollection<Point>>(toFeatureCollection([]));
    const flownToRef = useRef<string | null>(null);
    // Los listeners de los marcadores se crean una vez; la ref les da siempre el setPanelView actual
    // (con uno viejo, el historial de paneles quedaría desfasado).
    const openDetailRef = useRef((reporteId: string) => setPanelView("Detalle Incidente", { props: { reporteId } }));
    useEffect(() => {
        openDetailRef.current = (reporteId: string) => setPanelView("Detalle Incidente", { props: { reporteId } });
    });

    const reportesById = useMemo(() => new Map(filteredReportes.map((reporte) => [reporte.id, reporte])), [filteredReportes]);
    // La fuente se recrea solo si cambia el conjunto de categorías (sus conteos por grupo forman el anillo).
    const categoryIds = useMemo(() => [...categories.keys()].sort((a, b) => a - b).join(","), [categories]);

    // Fuente con clustering y sincronización de marcadores.
    useEffect(() => {
        if (!map || !categoryIds) return;

        const ids = categoryIds.split(",").map(Number);
        const markers = markersRef.current;
        let frameId = 0;

        const syncMarkers = () => {
            frameId = 0;
            // Sin exigir isSourceLoaded: querySourceFeatures devuelve lo ya cargado, y la siguiente sincronización completa el resto.
            if (!map.getSource(SOURCE_ID)) return;

            const nextItems = new Map<string, MarkerItem>();
            for (const feature of map.querySourceFeatures(SOURCE_ID)) {
                const props = feature.properties;
                const key = props.cluster ? `c-${props.cluster_id}` : `p-${props.id}`;
                if (nextItems.has(key)) continue; // querySourceFeatures repite los puntos que cruzan tiles

                const coordinates = (feature.geometry as Point).coordinates as [number, number];
                let entry = markers.get(key);
                if (!entry) {
                    // Botón y no div: el pin y el cluster responden al clic, así que también se enfocan con Tab
                    // y se activan con Enter o espacio. El nombre accesible lo pone el texto sr-only del pin.
                    const element = document.createElement("button");
                    element.type = "button";
                    element.className = "cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
                    element.addEventListener("mousedown", stopMapEvent);
                    element.addEventListener("click", stopMapEvent);
                    if (props.cluster) {
                        const clusterId = Number(props.cluster_id);
                        element.addEventListener("click", () => {
                            // El marcador se reutiliza y se mueve si el grupo se recalcula: se lee su posición actual.
                            const center = markers.get(key)?.marker.getLngLat();
                            if (!center) return;
                            (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)
                                ?.getClusterExpansionZoom(clusterId)
                                .then((zoom) => map.easeTo({ center, zoom }))
                                .catch(() => undefined);
                        });
                    } else {
                        const reporteId = String(props.id);
                        element.addEventListener("click", () => openDetailRef.current(reporteId));
                    }
                    entry = { marker: new Marker({ element }).setLngLat(coordinates).addTo(map), element };
                    markers.set(key, entry);
                } else {
                    entry.marker.setLngLat(coordinates);
                }

                nextItems.set(key, props.cluster
                    ? {
                        key,
                        kind: "cluster",
                        element: entry.element,
                        count: Number(props.point_count),
                        categoryCounts: ids.map((id): [number, number] => [id, Number(props[`cat_${id}`] ?? 0)]).filter(([, value]) => value > 0),
                    }
                    : { key, kind: "point", element: entry.element, reporteId: String(props.id) });
            }

            for (const [key, entry] of markers) {
                if (!nextItems.has(key)) {
                    entry.marker.remove();
                    markers.delete(key);
                }
            }
            setItems([...nextItems.values()]);
        };

        // Agrupa varias peticiones en una sola por fotograma.
        const scheduleSync = () => {
            if (!frameId) frameId = requestAnimationFrame(syncMarkers);
        };
        const handleSourceData = (event: MapSourceDataEvent) => {
            // Cualquier carga de tiles de la fuente; scheduleSync ya agrupa las llamadas en una por fotograma.
            if (event.sourceId === SOURCE_ID) scheduleSync();
        };

        const setup = () => {
            map.addSource(SOURCE_ID, {
                type: "geojson",
                data: dataRef.current,
                cluster: true,
                clusterRadius: 50,
                clusterMaxZoom: CLUSTER_MAX_ZOOM,
                // Cuántos incidentes de cada categoría hay en cada grupo (para el anillo del Figma).
                clusterProperties: Object.fromEntries(ids.map((id) => [
                    `cat_${id}`,
                    ["+", ["case", ["==", ["get", "incidente_id"], id], 1, 0]],
                ])),
            });
            map.addLayer({ id: LOAD_LAYER_ID, type: "circle", source: SOURCE_ID, paint: { "circle-radius": 0, "circle-opacity": 0 } });
            map.on("moveend", scheduleSync);
            // idle: el mapa terminó de cargar o de moverse; se dispara una vez por cada "reposo", no por fotograma.
            map.on("idle", scheduleSync);
            map.on("sourcedata", handleSourceData);
        };

        // isStyleLoaded() es false mientras cargan tiles aunque el estilo ya esté listo, y "load" puede haber
        // ocurrido ya: se intenta crear la fuente y, si el estilo aún no está listo, se reintenta en el siguiente styledata.
        const trySetup = () => {
            if (map.getSource(SOURCE_ID)) return;
            try {
                setup();
            } catch {
                map.once("styledata", trySetup);
            }
        };
        trySetup();

        return () => {
            cancelAnimationFrame(frameId);
            map.off("styledata", trySetup);
            map.off("moveend", scheduleSync);
            map.off("idle", scheduleSync);
            map.off("sourcedata", handleSourceData);
            for (const { marker } of markers.values()) marker.remove();
            markers.clear();
            // shortcut: si el mapa ya se destruyó, quitar capa y fuente falla; se ignora porque ya no existen.
            try {
                if (map.getLayer(LOAD_LAYER_ID)) map.removeLayer(LOAD_LAYER_ID);
                if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
            } catch { /* mapa ya destruido */ }
        };
    }, [map, categoryIds]);

    // Datos: al cambiar los reportes o los filtros del panel, se reemplaza el GeoJSON (el reagrupado ocurre en el worker).
    useEffect(() => {
        dataRef.current = toFeatureCollection(filteredReportes);
        (map?.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(dataRef.current);
    }, [map, filteredReportes]);

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
                    <IncidentPin reporte={reporte} incidente={categories.get(reporte.incidente_id)} isNew={reporte.id === createdId} />,
                    item.element,
                    item.key,
                );
            })}
        </>
    );
}
