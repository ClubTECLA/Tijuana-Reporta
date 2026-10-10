import { useEffect, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl';
import { LuLayers, LuMinus, LuNavigation, LuPlus } from 'react-icons/lu';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl);

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

  const [atMinZoom, setAtMinZoom] = useState(false);
  const [atMaxZoom, setAtMaxZoom] = useState(false);

  useEffect(() => {
    // Create the map once the container is available.
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-117.0382, 32.5149],
      zoom: 11,
      // Starts expanded and collapses to an "i" button when the map is dragged.
      attributionControl: { compact: true },
    });
  mapRef.current = map;

    map.on('zoom', () => {
      setAtMinZoom(map.getZoom() <= map.getMinZoom());
      setAtMaxZoom(map.getZoom() >= map.getMaxZoom());
    });
    // Remove the map instance when the component is unmounted.
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  const controlButtonStyle = `
    flex size-11 items-center justify-center rounded-full
    text-xl text-slate-700 transition-colors duration-200
    hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
  `;
  return (
    <div className="relative h-screen w-screen">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Map controls from the Figma ("Controles de mapa"), replacing MapLibre's NavigationControl. */}
      <div
        className="
          absolute right-4 top-1/2 z-10 -translate-y-1/2
          flex flex-col items-center p-1.5
          rounded-full border border-white/70
          bg-white/86 backdrop-blur-[14px]
          drop-shadow-[0_12px_18px_rgba(11,18,32,0.1)]
        "
      >
        {/* No map layers to toggle yet (reports, risk zones, shelters). */}
        <button type="button" className={controlButtonStyle} aria-label="Capas" title="Capas (próximamente)" disabled>
          <LuLayers />
        </button>
        <div className="h-px w-6 bg-slate-200" />
        <button type="button" className={controlButtonStyle} aria-label="Acercar" title="Acercar" disabled={atMaxZoom} onClick={() => mapRef.current?.zoomIn()}>
          <LuPlus />
        </button>
        <button type="button" className={controlButtonStyle} aria-label="Alejar" title="Alejar" disabled={atMinZoom} onClick={() => mapRef.current?.zoomOut()}>
          <LuMinus />
        </button>
        <div className="h-px w-6 bg-slate-200" />
        <button type="button" className={controlButtonStyle} aria-label="Orientar al norte" title="Orientar al norte" onClick={() => mapRef.current?.resetNorthPitch()}>
          <LuNavigation />
        </button>
      </div>
    </div>
  );
}