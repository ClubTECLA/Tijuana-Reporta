import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Centro, en píxeles del mapa, del espacio que queda libre entre el panel común y los controles del mapa: ahí se lleva
 * el incidente abierto y el marcador de "Nuevo incidente". Desde sm (40rem, el mismo corte que PanelChrome) el panel
 * tapa la izquierda; por debajo lo tapa entero y se usa el centro del mapa.
 */
export function freeMapCenter(map: MapLibreMap): [number, number] {
    const { width, height } = map.getContainer().getBoundingClientRect();
    if (!window.matchMedia("(min-width: 40rem)").matches) return [width / 2, height / 2];
    const left = document.querySelector("[data-common-panel]")?.getBoundingClientRect().right ?? 0;
    const right = document.querySelector("[data-map-controls]")?.getBoundingClientRect().left ?? width;
    return [(left + right) / 2, height / 2];
}
