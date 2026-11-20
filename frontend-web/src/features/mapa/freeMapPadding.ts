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
const SEPARACION = 16;
/**
 * Ancho libre mínimo, en px: con menos, el padding asimétrico no deja sitio y se usa el simétrico. A 768 px (tablet)
 * entre el panel y los controles quedan ~180 px.
 */
const MIN_LIBRE = 80;

/**
 * Padding para fitBounds que deja lo encuadrado en el espacio libre entre el panel (a la izquierda) y los controles
 * del mapa (a la derecha), y debajo de la cabecera. Sin panel o sin controles se usa el margen normal de ese lado. Si
 * a lo ancho no queda espacio libre suficiente (ventana muy angosta) los lados vuelven al margen normal. En pantallas
 * chicas el margen se reduce para que el padding nunca pase del tamaño del mapa.
 */
export function paddingLibre(
    ancho: number,
    alto: number,
    panelRight: number | null,
    controlsLeft: number | null,
    headerBottom: number | null,
): Padding {
    const margen = Math.min(MARGEN, Math.floor(Math.min(ancho, alto) / 6));
    // La cabecera es fija y tapa el mapa (dos filas por debajo de 1024 px): arriba nunca se encuadra debajo de ella.
    const top = headerBottom == null ? margen : Math.max(margen, headerBottom + SEPARACION);
    // Si con eso el alto libre no alcanza (teléfono en horizontal), cede el margen de abajo.
    const bottom = Math.min(margen, Math.max(0, alto - top - MIN_LIBRE));
    const left = panelRight == null ? margen : panelRight + SEPARACION;
    const right = controlsLeft == null ? margen : ancho - controlsLeft + SEPARACION;
    if (ancho - left - right < MIN_LIBRE) return { top, bottom, left: margen, right: margen };
    return { top, bottom, left, right };
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
    const header = document.querySelector("[data-app-header]");
    return paddingLibre(
        width,
        height,
        panel ? panel.getBoundingClientRect().right : null,
        controls ? controls.getBoundingClientRect().left : null,
        header ? header.getBoundingClientRect().bottom : null,
    );
}
