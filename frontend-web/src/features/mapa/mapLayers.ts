import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Añade fuentes y capas propias al mapa con `setup` y devuelve la limpieza que las quita.
 * isStyleLoaded() es false mientras cargan tiles aunque el estilo ya esté listo, y "load" puede haber ocurrido ya:
 * se intenta crear y, si el estilo aún no está listo, se reintenta en el siguiente styledata.
 * El primer elemento de `sources` sirve para saber si ya se crearon.
 */
export function setupMapLayers(map: MapLibreMap, setup: () => void, layers: string[], sources: string[]) {
    const trySetup = () => {
        if (map.getSource(sources[0])) return;
        try {
            setup();
        } catch {
            map.once("styledata", trySetup);
        }
    };
    trySetup();

    return () => {
        map.off("styledata", trySetup);
        // shortcut: si el mapa ya se destruyó, quitar capa y fuente falla; se ignora porque ya no existen.
        try {
            for (const layer of layers) if (map.getLayer(layer)) map.removeLayer(layer);
            for (const source of sources) if (map.getSource(source)) map.removeSource(source);
        } catch { /* mapa ya destruido */ }
    };
}
