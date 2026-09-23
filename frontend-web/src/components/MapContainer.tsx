import { useEffect, useRef } from 'react';
import {
  Map as MapLibreMap,
  NavigationControl,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const fallbackMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'openstreetmap',
      type: 'raster',
      source: 'openstreetmap',
    },
  ],
};

const mapStyle =
  import.meta.env.VITE_MAPLIBRE_STYLE_URL || fallbackMapStyle;

// MapLibre map container component.
export default function MapContainer() {
  // Stores the HTML element where MapLibre renders the map.
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Stores the MapLibre instance across component renders.
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    // Create the map once the container is available.
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-117.0382, 32.5149],
      zoom: 11,
    });

    mapRef.current.addControl(new NavigationControl(), 'top-right');

    // Remove the map instance when the component is unmounted.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="h-screen w-screen"
    />
  );
}