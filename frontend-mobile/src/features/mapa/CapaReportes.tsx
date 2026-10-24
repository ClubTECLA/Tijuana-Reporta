import { useCallback, useMemo, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import type { CategoriaUI } from '@/features/categorias/categorias';
import { colors } from '@/theme/colors';
import type { Reporte } from '@/types/api';
import { clusterDeFeature, featuresDeReportes, idDeFeature } from './featuresReportes';

// Los pins se dibujan DENTRO del mapa (fuente GeoJSON + capas), no como vistas encima: así el mapa los pinta en el
// mismo fotograma que el resto y no se desfasan al mover la cámara (con `Marker`, que son vistas de React Native
// reposicionadas aparte, los pins iban por delante del mapa).
const IMAGENES = {
  inundacion: require('../../../assets/map/iconos/inundacion.png'),
  deslave: require('../../../assets/map/iconos/deslave.png'),
  arbol: require('../../../assets/map/iconos/arbol.png'),
  socavon: require('../../../assets/map/iconos/socavon.png'),
  drenaje: require('../../../assets/map/iconos/drenaje.png'),
  luz: require('../../../assets/map/iconos/luz.png'),
  incendio: require('../../../assets/map/iconos/incendio.png'),
  generico: require('../../../assets/map/iconos/generico.png'),
};

// Medidas en dp, las del marcador de Figma (canvas 96: halo r=48, badge r=25 con borde blanco de 2).
const RADIO_HALO = 48;
const RADIO_BADGE = 25;
const BORDE = 2;
// Los PNG miden 104 px y deben verse de 26 dp (la mitad del badge, como en la web).
const ESCALA_ICONO = 26 / 104;
// Insignia de confirmaciones: círculo oscuro pegado a la esquina superior derecha del badge.
const RADIO_INSIGNIA = 10;
const DESPLAZAMIENTO_INSIGNIA: [number, number] = [RADIO_BADGE * 0.72 + 2, -(RADIO_BADGE * 0.72 + 2)];
const FUENTE_INSIGNIA = ['Open Sans Bold', 'Noto Sans Regular'];
// Pins a menos de RADIO_GRUPO dp se agrupan en un círculo con su cantidad, hasta ZOOM_MAX_GRUPO (como en la web).
// Además evita que se encimen los círculos y los iconos de pins vecinos.
const RADIO_GRUPO = 50;
const ZOOM_MAX_GRUPO = 14;
const ES_GRUPO: ['has', string] = ['has', 'point_count'];
const ES_PIN: ['!', ['has', string]] = ['!', ['has', 'point_count']];

interface CapaReportesProps {
  reportes: readonly Reporte[];
  catalogo: readonly CategoriaUI[];
  seleccionadoId: string | null;
  onSeleccionar: (reporte: Reporte) => void;
  /** Un grupo se tocó: acerca la cámara a su centro con el zoom en que se separa. */
  onAcercar: (centro: [number, number], zoom: number) => void;
}

export function CapaReportes({ reportes, catalogo, seleccionadoId, onSeleccionar, onAcercar }: CapaReportesProps) {
  const datos = useMemo(
    () => featuresDeReportes(reportes, catalogo, seleccionadoId),
    [reportes, catalogo, seleccionadoId],
  );
  const fuente = useRef<MapLibreGL.GeoJSONSourceRef>(null);
  const alPresionar = useCallback(
    (e: NativeSyntheticEvent<{ features: GeoJSON.Feature[] }>) => {
      const { features } = e.nativeEvent;
      const grupo = clusterDeFeature(features);
      if (grupo) {
        void fuente.current?.getClusterExpansionZoom(grupo.clusterId).then((zoom) => onAcercar(grupo.centro, zoom));
        return;
      }
      const id = idDeFeature(features);
      const reporte = id === null ? undefined : reportes.find((r) => r.id === id);
      if (reporte) onSeleccionar(reporte);
    },
    [reportes, onSeleccionar, onAcercar],
  );

  return (
    <>
      <MapLibreGL.Images images={IMAGENES} />
      <MapLibreGL.GeoJSONSource
        id="reportes"
        ref={fuente}
        data={datos}
        cluster
        clusterRadius={RADIO_GRUPO}
        clusterMaxZoom={ZOOM_MAX_GRUPO}
        onPress={alPresionar}
        hitbox={{ top: RADIO_BADGE, right: RADIO_BADGE, bottom: RADIO_BADGE, left: RADIO_BADGE }}
      >
        <MapLibreGL.Layer
          id="reportes-halo"
          filter={ES_PIN}
          type="circle"
          paint={{
            'circle-radius': RADIO_HALO,
            'circle-color': ['get', 'color'],
            'circle-opacity': ['case', ['get', 'seleccionado'], 0.35, 0.1],
            'circle-blur': 0.6,
          }}
        />
        <MapLibreGL.Layer
          id="reportes-badge"
          filter={ES_PIN}
          type="circle"
          paint={{
            'circle-radius': RADIO_BADGE,
            'circle-color': ['get', 'color'],
            'circle-stroke-color': colors.white,
            'circle-stroke-width': BORDE,
          }}
        />
        <MapLibreGL.Layer
          id="reportes-icono"
          filter={ES_PIN}
          type="symbol"
          layout={{
            'icon-image': ['get', 'icono'],
            'icon-size': ESCALA_ICONO,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          }}
        />
        <MapLibreGL.Layer
          id="reportes-insignia"
          filter={ES_PIN}
          type="circle"
          paint={{
            'circle-radius': RADIO_INSIGNIA,
            'circle-color': colors.textPrimary,
            'circle-stroke-color': colors.white,
            'circle-stroke-width': BORDE,
            'circle-translate': DESPLAZAMIENTO_INSIGNIA,
            'circle-translate-anchor': 'viewport',
          }}
        />
        <MapLibreGL.Layer
          id="reportes-confirmaciones"
          filter={ES_PIN}
          type="symbol"
          layout={{
            'text-field': ['get', 'confirmaciones'],
            'text-font': FUENTE_INSIGNIA,
            'text-size': 12,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{
            'text-color': colors.white,
            'text-translate': DESPLAZAMIENTO_INSIGNIA,
            'text-translate-anchor': 'viewport',
          }}
        />
        <MapLibreGL.Layer
          id="reportes-grupo"
          filter={ES_GRUPO}
          type="circle"
          paint={{
            'circle-radius': ['step', ['get', 'point_count'], 20, 5, 24, 10, 28],
            'circle-color': colors.brand,
            'circle-stroke-color': colors.white,
            'circle-stroke-width': BORDE,
          }}
        />
        <MapLibreGL.Layer
          id="reportes-grupo-cantidad"
          filter={ES_GRUPO}
          type="symbol"
          layout={{
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': FUENTE_INSIGNIA,
            'text-size': 14,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          }}
          paint={{ 'text-color': colors.white }}
        />
      </MapLibreGL.GeoJSONSource>
    </>
  );
}
