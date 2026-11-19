import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Marker, type GeoJSONSource } from "maplibre-gl";
import { LuTriangleAlert } from "react-icons/lu";
import { useRiesgo } from "@/features/riesgo/useRiesgo";
import { formatScore, NIVEL_COLORS } from "@/features/riesgo/riesgo";
import { setupMapLayers } from "./mapLayers";
import { useMap } from "./useMap";
import { areaCanonica, celdasGeoJSON, zonaBounds, zonasGeoJSON } from "./riesgoGeo";

// Capa de riesgo del mapa (pantalla "28. Riesgo" del Figma): mapa de calor de los reportes históricos y las zonas de
// riesgo como círculos punteados con su nombre e índice. Solo existe mientras el panel "Riesgo" está abierto.
const CALOR_SOURCE = "riesgo-calor";
const CALOR_LAYER = "riesgo-calor";
const ZONAS_SOURCE = "riesgo-zonas";
const ZONAS_FILL = "riesgo-zonas-relleno";
const ZONAS_LINE = "riesgo-zonas-borde";

// Espera tras el último movimiento antes de pedir el calor del área nueva.
const DEBOUNCE_MS = 300;

// Rampa del Figma ("Densidad de incidentes"): de transparente a amarillo, naranja y rojo.
const HEAT_COLORS = ["rgba(255,214,102,0)", "#ffd666", "#f7a440", "#ef6c33", "#d93f3f"];

const stopMapEvent = (event: Event) => event.stopPropagation();

export default function RiesgoLayer() {
    const { map } = useMap();
    const { activo, mapaCalor, resumen, cargarMapaCalor, zonaEnfocada, enfocarZona } = useRiesgo();
    const enfocarRef = useRef(enfocarZona);
    // Últimos datos: si el estilo del mapa termina de cargar después que ellos, las fuentes se crean ya con ellos.
    const calorRef = useRef(mapaCalor);
    const zonasRef = useRef(resumen?.zonas ?? []);
    useEffect(() => {
        enfocarRef.current = enfocarZona;
        calorRef.current = mapaCalor;
        zonasRef.current = resumen?.zonas ?? [];
    });

    // Fuentes y capas, y la recarga del calor al mover el mapa.
    useEffect(() => {
        if (!map || !activo) return;

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const pedirCalor = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const bounds = map.getBounds();
                cargarMapaCalor({
                    // Al desplazarse por las copias del mundo las longitudes pasan de ±180: se llevan a -180..180.
                    ...areaCanonica(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()),
                    zoom: Math.min(22, Math.max(0, map.getZoom())),
                });
            }, DEBOUNCE_MS);
        };

        const removeLayers = setupMapLayers(map, () => {
            map.addSource(CALOR_SOURCE, { type: "geojson", data: celdasGeoJSON(calorRef.current) });
            map.addSource(ZONAS_SOURCE, { type: "geojson", data: zonasGeoJSON(zonasRef.current) });
            map.addLayer({
                id: CALOR_LAYER,
                type: "heatmap",
                source: CALOR_SOURCE,
                paint: {
                    // Raíz del peso normalizado: con pocas celdas muy cargadas, el resto seguiría siendo visible.
                    "heatmap-weight": ["sqrt", ["get", "w"]],
                    // Cada celda mide ~32 px en pantalla (ver backend/GUIA_RIESGO.md): el radio las funde entre sí.
                    "heatmap-radius": 40,
                    "heatmap-intensity": 1.5,
                    "heatmap-opacity": 0.75,
                    "heatmap-color": [
                        "interpolate", ["linear"], ["heatmap-density"],
                        0, HEAT_COLORS[0], 0.2, HEAT_COLORS[1], 0.45, HEAT_COLORS[2], 0.7, HEAT_COLORS[3], 1, HEAT_COLORS[4],
                    ],
                },
            });
            map.addLayer({
                id: ZONAS_FILL,
                type: "fill",
                source: ZONAS_SOURCE,
                paint: { "fill-color": ["get", "color"], "fill-opacity": 0.08 },
            });
            map.addLayer({
                id: ZONAS_LINE,
                type: "line",
                source: ZONAS_SOURCE,
                paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [3, 2] },
            });
            map.on("moveend", pedirCalor);
            pedirCalor();
        }, [ZONAS_LINE, ZONAS_FILL, CALOR_LAYER], [CALOR_SOURCE, ZONAS_SOURCE]);

        return () => {
            clearTimeout(timeoutId);
            map.off("moveend", pedirCalor);
            removeLayers();
        };
    }, [map, activo, cargarMapaCalor]);

    // Datos del calor.
    useEffect(() => {
        if (!activo) return;
        (map?.getSource(CALOR_SOURCE) as GeoJSONSource | undefined)?.setData(celdasGeoJSON(mapaCalor));
    }, [map, activo, mapaCalor]);

    // Etiqueta de cada zona: un botón donde se pinta su contenido con un portal (marcadores HTML: el estilo base del
    // mapa no trae tipografías para textos). Se crean sueltos; el efecto de abajo los coloca en el mapa.
    const etiquetas = useMemo(() => (activo ? resumen?.zonas ?? [] : []).map((zona) => {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
        element.addEventListener("mousedown", stopMapEvent);
        return { zona, element };
    }), [activo, resumen]);

    // Círculos de las zonas y sus etiquetas en el mapa.
    useEffect(() => {
        (map?.getSource(ZONAS_SOURCE) as GeoJSONSource | undefined)?.setData(zonasGeoJSON(etiquetas.map(({ zona }) => zona)));
        if (!map) return;
        const markers = etiquetas.map(({ zona, element }) => {
            // El clic centra la zona, igual que elegirla en la lista del panel.
            const onClick = (event: Event) => {
                stopMapEvent(event);
                enfocarRef.current(zona);
            };
            element.addEventListener("click", onClick);
            const marker = new Marker({ element }).setLngLat([zona.longitude, zona.latitude]).addTo(map);
            return () => {
                element.removeEventListener("click", onClick);
                marker.remove();
            };
        });
        return () => {
            for (const quitar of markers) quitar();
        };
    }, [map, etiquetas]);

    // Zona elegida en la lista o en el mapa: se centra con su círculo completo a la vista.
    useEffect(() => {
        if (!map || !activo || !zonaEnfocada) return;
        map.fitBounds(zonaBounds(zonaEnfocada), { padding: 120, maxZoom: 16 });
    }, [map, activo, zonaEnfocada]);

    if (!activo) return null;

    return (
        <>
            {etiquetas.map(({ zona, element }) => createPortal(
                <span
                    className="flex items-center gap-1 whitespace-nowrap rounded-md border border-dashed bg-white/95 px-1.5 py-0.5 text-2xs font-semibold shadow-raised"
                    style={{ color: NIVEL_COLORS[zona.nivel], borderColor: NIVEL_COLORS[zona.nivel] }}
                >
                    <LuTriangleAlert className="size-3" aria-hidden />
                    {zona.nombre} · {formatScore(zona.score)}
                    <span className="sr-only">, riesgo {zona.nivel}</span>
                </span>,
                element,
                `${zona.latitude},${zona.longitude}`,
            ))}

            {/* "Densidad de incidentes" del Figma, arriba a la derecha bajo el perfil. */}
            <div className="absolute right-4 top-20 z-10 hidden w-44 flex-col gap-1.5 rounded-2xl border border-glass-line bg-white px-3.5 py-2.5 font-ui shadow-soft sm:flex">
                <span className="text-xs font-bold text-ink">Densidad de incidentes</span>
                <span className="h-1.5 rounded-full" style={{ background: `linear-gradient(to right, ${HEAT_COLORS.slice(1).join(", ")})` }} />
                <span className="flex justify-between text-2xs text-ink-muted"><span>Baja</span><span>Alta</span></span>
            </div>
        </>
    );
}
