import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  Map as MapLibreMap,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl';
import { LuFilter, LuLayers, LuMinus, LuNavigation, LuPlus } from 'react-icons/lu';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useMap } from './useMap';
import ActionDock from '@/features/reportes/components/ActionDock';
import ActiveFiltersBadge from '@/features/reportes/components/ActiveFiltersBadge';
import { useCommonPanel } from '@/panels/useCommonPanel';
import useModals from '@/panels/useModals';
import BellButton from '@/features/notificaciones/components/BellButton';
import IncidentsLayer from './IncidentsLayer';
import CentrosLayer from '@/features/centros/CentrosLayer';
import LayersPill from './LayersPill';

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

  const { setMap } = useMap();
  const { openPanel } = useCommonPanel();
  const { openModal, closeModal, currentModal } = useModals();

  useEffect(() => {
    // Create the map once the container is available.
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-117.0382, 32.5149],
      zoom: 11,
      // Added below in the top-right corner instead of the default bottom-right.
      attributionControl: false,
    });
  mapRef.current = map;
    // Shares the map with the panels (MapContext).
    setMap(map);

    // Compact, as MapLibre's default: starts expanded (OpenStreetMap requires it visible) and collapses to an "i" button
    // when the map is dragged. Top-right, below the header: at the bottom-right its text ran under the action dock.
    map.addControl(new AttributionControl({ compact: true }), 'top-right');

    map.on('zoom', () => {
      setAtMinZoom(map.getZoom() <= map.getMinZoom());
      setAtMaxZoom(map.getZoom() >= map.getMaxZoom());
    });
    // Remove the map instance when the component is unmounted.
    return () => {
      setMap(null);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [setMap]);
  const controlButtonStyle = `
    flex size-11 items-center justify-center rounded-full
    text-xl text-icon transition-colors duration-200
    hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
  `;
  return (
    // Fixed to the viewport, not h-screen: on phones 100vh is taller than the visible area (browser bars), so the page
    // scrolled under the fixed header. overflow-hidden: a floating control that doesn't fit is clipped, not scrolled.
    // The top-right corner (attribution) starts below the header: two rows below 1024 px, one from there. Important
    // because MapLibre's stylesheet is unlayered and would win over a Tailwind utility.
    <div className="fixed inset-0 overflow-hidden [&_.maplibregl-ctrl-top-right]:top-34! lg:[&_.maplibregl-ctrl-top-right]:top-20!">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Map controls from the Figma ("Controles de mapa"), replacing MapLibre's NavigationControl. On phones the bell
          floats above them, as the floating buttons of the mobile Figma. */}
      {/* data-map-controls: freeMapCenter los mide para no centrar nada debajo de ellos. */}
      <div data-map-controls className="absolute right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3">
        <BellButton
          className="sm:hidden"
          onClick={() => currentModal === 'Menu de Notificaciones' ? closeModal() : openModal('Menu de Notificaciones')}
        />
        <div
          className="
            flex flex-col items-center p-1.5
            rounded-full border border-glass-line
            bg-glass backdrop-blur-glass
            drop-shadow-floating
          "
        >
          {/* Below 1024 px (phones and tablets) the layers pill is hidden and this button shows the filter icon instead. */}
          <button type="button" className={controlButtonStyle} aria-label="Capas y filtros" title="Capas y filtros" onClick={() => openPanel('Capas y filtros')}>
            <LuLayers className="max-lg:hidden" />
            <LuFilter className="lg:hidden" />
          </button>
          <div className="h-px w-6 bg-line-soft" />
          <button type="button" className={controlButtonStyle} aria-label="Acercar" title="Acercar" disabled={atMaxZoom} onClick={() => mapRef.current?.zoomIn()}>
            <LuPlus />
          </button>
          <button type="button" className={controlButtonStyle} aria-label="Alejar" title="Alejar" disabled={atMinZoom} onClick={() => mapRef.current?.zoomOut()}>
            <LuMinus />
          </button>
          <div className="h-px w-6 bg-line-soft" />
          <button type="button" className={controlButtonStyle} aria-label="Orientar al norte" title="Orientar al norte" onClick={() => mapRef.current?.resetNorthPitch()}>
            <LuNavigation />
          </button>
        </div>
      </div>

      <ActionDock />
      <ActiveFiltersBadge />
      <LayersPill />
      <IncidentsLayer />
      <CentrosLayer />
    </div>
  );
}