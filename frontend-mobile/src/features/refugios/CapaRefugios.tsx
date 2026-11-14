import { useCallback, useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { featuresDeRefugios, idDeRefugio } from './featuresRefugios';
import type { Refugio } from './types';

// Igual que los pines de reportes: el marcador se dibuja DENTRO del mapa (fuente GeoJSON + capa de símbolos),
// no como una vista encima, para que no se desfase al mover la cámara.
const IMAGENES = {
  refugio: require('../../../assets/map/iconos/refugio.png'),
};

// El PNG (336 px) es el lienzo de 131.7 del Figma (halo + cuadrado rosa con el escudo) a 3x. En el mapa de
// Figma ese lienzo se ve de ~112 dp, así que el icono mide 112/336 de su tamaño.
const ESCALA_ICONO = 112 / 336;
// Al seleccionarlo crece un poco, como el halo de los pines de reportes.
const ESCALA_SELECCIONADO = ESCALA_ICONO * 1.12;
// El cuadrado del marcador mide ~51 x 60 dp: el toque abarca eso aunque el halo sea más grande.
const HITBOX = 30;

interface CapaRefugiosProps {
  refugios: readonly Refugio[];
  seleccionadoId: string | null;
  onSeleccionar: (refugio: Refugio) => void;
}

/** Marcadores de refugio sobre el mapa de incidentes, cuando la capa de refugios está encendida (Figma 10.2). */
export function CapaRefugios({ refugios, seleccionadoId, onSeleccionar }: CapaRefugiosProps) {
  const datos = useMemo(() => featuresDeRefugios(refugios, seleccionadoId), [refugios, seleccionadoId]);

  const alPresionar = useCallback(
    (e: NativeSyntheticEvent<{ features: GeoJSON.Feature[] }>) => {
      const id = idDeRefugio(e.nativeEvent.features);
      const refugio = id === null ? undefined : refugios.find((r) => r.id === id);
      if (refugio) onSeleccionar(refugio);
    },
    [refugios, onSeleccionar],
  );

  return (
    <>
      <MapLibreGL.Images images={IMAGENES} />
      <MapLibreGL.GeoJSONSource
        id="refugios"
        data={datos}
        onPress={alPresionar}
        hitbox={{ top: HITBOX, right: HITBOX, bottom: HITBOX, left: HITBOX }}
      >
        <MapLibreGL.Layer
          id="refugios-marcador"
          type="symbol"
          layout={{
            'icon-image': 'refugio',
            'icon-size': ['case', ['get', 'seleccionado'], ESCALA_SELECCIONADO, ESCALA_ICONO],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          }}
        />
      </MapLibreGL.GeoJSONSource>
    </>
  );
}
