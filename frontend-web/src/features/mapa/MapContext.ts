import { createContext } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

// Comparte la instancia de MapLibre que crea MapContainer. La usan la capa de incidentes y useLocationPicker;
// el resto de la app no toca MapLibre. MapProvider guarda la instancia.
export interface MapContextType {
    map: MapLibreMap | null;
    setMap: (map: MapLibreMap | null) => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);
