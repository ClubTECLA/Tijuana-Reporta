import { useState, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { MapContext } from "./MapContext.ts";

export function MapProvider({ children }: { children: ReactNode }) {
    const [map, setMap] = useState<MapLibreMap | null>(null);

    return (
        <MapContext.Provider value={{ map, setMap }}>
            {children}
        </MapContext.Provider>
    );
}
