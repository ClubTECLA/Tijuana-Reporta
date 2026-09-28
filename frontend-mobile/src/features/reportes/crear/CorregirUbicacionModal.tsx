import { useCallback, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as MapLibreGL from '@maplibre/maplibre-react-native';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { PinDestacadoIcon } from '@/components/icons/PinDestacadoIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const PIN_WIDTH = 27;
const PIN_HEIGHT = 43;
// Separación entre la tarjeta y los bordes de la pantalla (backdrop.padding × 2).
const MARGEN_TARJETA = 12;

interface CorregirUbicacionModalProps {
  visible: boolean;
  lat: number;
  lng: number;
  onCancelar: () => void;
  onGuardar: (lat: number, lng: number) => void;
}

// Modal "Corregir ubicación" (Figma 1460:11951). El marcador queda fijo al
// centro del mapa y se "arrastra" moviendo el mapa por debajo: el punto que
// queda bajo el marcador al guardar es la ubicación corregida.
export function CorregirUbicacionModal({ visible, lat, lng, onCancelar, onGuardar }: CorregirUbicacionModalProps) {
  const centro = useRef({ lat, lng });
  const { height: pantallaAlto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Alto del mapa: el del Figma (503) como máximo; si la tarjeta no cabe (pantalla baja o
  // fuente grande), el mapa se encoge en vez de empujar los botones fuera de la tarjeta.
  const mapaAlto = Math.min(503, pantallaAlto * 0.55);
  const tarjetaMaxAlto = pantallaAlto - insets.top - insets.bottom - MARGEN_TARJETA * 2;

  const alMover = useCallback((event: NativeSyntheticEvent<MapLibreGL.ViewStateChangeEvent>) => {
    const [longitude, latitude] = event.nativeEvent.center;
    centro.current = { lat: latitude, lng: longitude };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancelar}
      onShow={() => {
        centro.current = { lat, lng };
      }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.tarjeta, { maxHeight: tarjetaMaxAlto }]}>
          <View style={styles.encabezado}>
            <View style={styles.iconoCaja}>
              <LocationPinIcon size={24} color={colors.brand} />
            </View>
            <View style={styles.titulos}>
              <Text style={styles.titulo} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
                Corregir ubicación
              </Text>
              <Text style={styles.subtitulo}>Arrastra el marcador al punto correcto. Se avisa a quienes reportaron.</Text>
            </View>
            <Pressable onPress={onCancelar} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.cerrar}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={colors.slate}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>

          <View style={styles.contenido}>
            <View style={[styles.mapa, { height: mapaAlto }]}>
              <MapLibreGL.Map
                style={StyleSheet.absoluteFill}
                mapStyle={MAP_STYLE}
                touchPitch={false}
                touchRotate={false}
                compass={false}
                logo={false}
                attribution={false}
                onRegionDidChange={alMover}
              >
                <MapLibreGL.Camera initialViewState={{ center: [lng, lat], zoom: 16 }} />
              </MapLibreGL.Map>
              {/* Punta del pin en el centro exacto del mapa, sea cual sea su alto. */}
              <View pointerEvents="none" style={styles.pinCentro}>
                <View style={styles.pin}>
                  <PinDestacadoIcon width={PIN_WIDTH} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.pie}>
            <Pressable onPress={onCancelar} accessibilityRole="button" style={[styles.boton, styles.cancelar]}>
              <Text style={styles.cancelarTexto} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                Cancelar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onGuardar(centro.current.lat, centro.current.lng)}
              accessibilityRole="button"
              style={[styles.boton, styles.guardar]}
            >
              <CheckIcon size={20} color={colors.white} />
              <Text style={styles.guardarTexto} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
                Guardar ubicación
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: MARGEN_TARJETA,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.white,
    elevation: 24,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 16,
  },
  iconoCaja: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.infoSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulos: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  titulo: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `flexShrink` en cadena (contenido → mapa): si la tarjeta topa con su alto máximo, cede el mapa.
  contenido: {
    flexShrink: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  mapa: {
    flexShrink: 1,
    minHeight: 140,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.photoBackground,
  },
  pinCentro: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // La caja del pin se sube para que su punta (unos 4 px sobre el borde inferior) caiga en el centro.
  pin: {
    transform: [{ translateY: 4 - PIN_HEIGHT / 2 }],
  },
  pie: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.surface,
  },
  boton: {
    height: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  // Cancelar mide lo que su texto; Guardar ocupa el resto de la fila y su texto se encoge si hace falta.
  cancelar: {
    flexShrink: 0,
    paddingHorizontal: 20,
    backgroundColor: colors.bgCanvas,
  },
  cancelarTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  guardar: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.brand,
    elevation: 4,
    shadowColor: colors.brand,
  },
  guardarTexto: {
    flexShrink: 1,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
});
