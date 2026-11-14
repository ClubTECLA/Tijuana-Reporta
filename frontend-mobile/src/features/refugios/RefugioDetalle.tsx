import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CarpaIcon } from '@/components/icons/CarpaIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { SendIcon } from '@/components/icons/SendIcon';
import { CerrarButton } from '@/features/reportes/crear/CerrarButton';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { espaciosDisponibles } from './capacidad';
import { useDireccionRefugio } from './hooks';
import type { Refugio } from './types';

const ALTURA_CABECERA = 151;
// Aire que se deja entre la tarjeta y el borde superior de la zona segura.
const MARGEN_SUPERIOR = 16;
// Los números de la capacidad van en monoespaciada (JetBrains Mono en el Figma; no está en el proyecto).
const FUENTE_NUMEROS = Platform.select({ ios: 'Menlo', default: 'monospace' });

interface RefugioDetalleProps {
  refugio: Refugio;
  /** Separación entre la tarjeta y el borde inferior de la pantalla. */
  bottom: number;
  onClose: () => void;
}

/** Ruta en la app de mapas del dispositivo hacia el refugio (el Figma lo resuelve con Google Maps). */
const urlRuta = (r: Refugio) => `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;

/** Fracción (0-1) de la capacidad que está libre, para llenar la barra; `null` si la capacidad es 0. */
function fraccionDisponible(disponibles: number, capacidad: number): number | null {
  if (capacidad <= 0) return null;
  return Math.min(1, Math.max(0, disponibles / capacidad));
}

/**
 * Tarjeta "Modal - Refugio" (Figma): foto, nombre, dirección, descripción, espacios disponibles y "Ir a Refugio".
 * Se abre al tocar un marcador de refugio del mapa.
 */
export function RefugioDetalle({ refugio, bottom, onClose }: RefugioDetalleProps) {
  const { height: pantallaAlto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Con descripción larga, texto grande o una pantalla baja la tarjeta no debe salirse por arriba: se acota al
  // espacio libre y el cuerpo se desplaza, con la cabecera (y su botón de cerrar) y "Ir a Refugio" fijos.
  const alturaMaxima = pantallaAlto - insets.top - bottom - MARGEN_SUPERIOR;
  const direccion = useDireccionRefugio(refugio);
  // El backend guarda cuánta gente cabe y cuánta hay; lo que muestra el Figma ("35 de 50") son los espacios libres.
  const { capacidad } = refugio;
  const disponibles = espaciosDisponibles(refugio);
  const fraccion = disponibles !== null && capacidad !== null ? fraccionDisponible(disponibles, capacidad) : null;

  const irARefugio = () => {
    Linking.openURL(urlRuta(refugio)).catch((err) => console.warn('[RefugioDetalle] no se pudo abrir la ruta:', err));
  };

  return (
    <View style={[styles.tarjeta, { bottom, maxHeight: alturaMaxima }]}>
      <View style={styles.cabecera}>
        {refugio.imagenUrl ? (
          <Image source={{ uri: refugio.imagenUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fotoVacia]}>
            <CarpaIcon size={44} color={colors.labelMuted} />
          </View>
        )}
        <View style={styles.cerrar}>
          <CerrarButton onPress={onClose} />
        </View>
      </View>

      <ScrollView
        style={styles.cuerpo}
        contentContainerStyle={styles.cuerpoContenido}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.titulo}>
          <CarpaIcon size={22} color={colors.ink} />
          <Text style={styles.tituloTexto} numberOfLines={2} accessibilityRole="header">
            {refugio.nombre}
          </Text>
        </View>

        <View style={styles.zona}>
          <LocationPinIcon size={23} color={colors.slate} />
          <Text style={styles.zonaTexto} numberOfLines={2}>
            {direccion === undefined
              ? 'Buscando dirección…'
              : (direccion ?? `${refugio.lat.toFixed(4)}, ${refugio.lng.toFixed(4)}`)}
          </Text>
        </View>

        {refugio.descripcion !== null && (
          <View style={styles.descripcion}>
            <Text style={styles.descripcionEtiqueta}>DESCRIPCIÓN</Text>
            <Text style={styles.descripcionTexto}>{refugio.descripcion}</Text>
          </View>
        )}

        {disponibles !== null && capacidad !== null && (
          <View style={styles.capacidad}>
            <View style={styles.capacidadFila}>
              <Text style={styles.capacidadTitulo}>Espacios disponibles del refugio</Text>
              <Text style={styles.capacidadNumeros}>{`${disponibles} de ${capacidad}`}</Text>
            </View>
            {fraccion !== null && (
              <View style={styles.barra} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: capacidad, now: disponibles }}>
                <View style={[styles.barraRelleno, { width: `${fraccion * 100}%` }]} />
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.pie}>
        <Pressable
          onPress={irARefugio}
          accessibilityRole="button"
          accessibilityLabel="Ir a Refugio"
          style={({ pressed }) => [styles.ir, pressed && styles.presionado]}
        >
          <SendIcon size={20} color={colors.white} />
          <Text style={styles.irTexto}>Ir a Refugio</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    position: 'absolute',
    left: 10,
    right: 10,
    borderRadius: 30,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    gap: 13,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  // Lo único que se encoge (y se desplaza) cuando falta alto es el cuerpo: cabecera y pie se quedan completos.
  cuerpo: {
    flexShrink: 1,
  },
  cuerpoContenido: {
    gap: 13,
  },
  cabecera: {
    flexShrink: 0,
    height: ALTURA_CABECERA,
    backgroundColor: colors.photoBackground,
  },
  fotoVacia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cerrar: {
    position: 'absolute',
    top: 9,
    right: 9,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  tituloTexto: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 27.5,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  zona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },
  zonaTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.slate,
  },
  descripcion: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: 1.3,
    borderTopColor: colors.borderSubtle,
  },
  descripcionEtiqueta: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.textMuted,
  },
  descripcionTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  capacidad: {
    gap: 10,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.capacidadFondo,
  },
  capacidadFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  capacidadTitulo: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  capacidadNumeros: {
    fontFamily: FUENTE_NUMEROS,
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.brandText,
  },
  barra: {
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.brand,
  },
  pie: {
    flexShrink: 0,
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1.3,
    borderTopColor: colors.borderSubtle,
  },
  ir: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.brand,
    elevation: 4,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 1.55,
  },
  irTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.white,
  },
  presionado: {
    opacity: 0.85,
  },
});
