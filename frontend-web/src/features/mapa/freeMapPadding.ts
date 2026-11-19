import type { Map as MapLibreMap } from "maplibre-gl";

/** Padding de fitBounds con los cuatro lados (en MapLibre son opcionales). */
export interface Padding {
    top: number
    bottom: number
    left: number
    right: number
}

/** Margen alrededor de lo que se encuadra, en px: deja ver el borde del círculo y no lo pega a la cabecera ni al dock. */
const MARGEN = 120;
/** Separación del panel y de los controles, en px. */
const SEPARACION = 40;
/** Ancho libre mínimo, en px: con menos, el padding asimétrico no deja sitio y se usa el simétrico. */
const MIN_LIBRE = 160;

/**
 * Padding para fitBounds que deja lo encuadrado en el espacio libre entre el panel (a la izquierda) y los controles
 * del mapa (a la derecha). Sin panel o sin controles se usa el margen normal de ese lado. Si no queda espacio libre
 * suficiente (ventana muy angosta) vuelve al padding simétrico. En pantallas chicas el margen se reduce para que el
 * padding nunca pase del tamaño del mapa.
 */
export function paddingLibre(
    ancho: number,
    alto: number,
    panelRight: number | null,
    controlsLeft: number | null,
): Padding {
    const margen = Math.min(MARGEN, Math.floor(Math.min(ancho, alto) / 6));
    const simetrico = { top: margen, bottom: margen, left: margen, right: margen };
    const left = panelRight == null ? margen : panelRight + SEPARACION;
    const right = controlsLeft == null ? margen : ancho - controlsLeft + SEPARACION;
    if (ancho - left - right < MIN_LIBRE) return simetrico;
    return { top: margen, bottom: margen, left, right };
}

/**
 * paddingLibre con las medidas reales del mapa, igual que freeMapCenter: desde sm (40rem, el corte de PanelChrome) el
 * panel tapa la izquierda; por debajo lo tapa entero (o está cerrado) y no hay lado que esquivar.
 */
export function freeMapPadding(map: MapLibreMap): Padding {
    const { width, height } = map.getContainer().getBoundingClientRect();
    const desdeSm = window.matchMedia("(min-width: 40rem)").matches;
    const panel = desdeSm ? document.querySelector("[data-common-panel]") : null;
    const controls = document.querySelector("[data-map-controls]");
    return paddingLibre(
        width,
        height,
        panel ? panel.getBoundingClientRect().right : null,
        controls ? controls.getBoundingClientRect().left : null,
    );
}
