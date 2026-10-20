import { createContext, useState, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

// Comparte la instancia de MapLibre que crea MapContainer, para que los paneles
// (p. ej. "Nuevo incidente") puedan poner marcadores o mover la cámara.
interface MapContextType {
    map: MapLibreMap | null;
    setMap: (map: MapLibreMap | null) => void;
}

export const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
    const [map, setMap] = useState<MapLibreMap | null>(null);

    return (
        <MapContext.Provider value={{ map, setMap }}>
            {children}
        </MapContext.Provider>
    );
}
