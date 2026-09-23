import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Reporte } from '@/types/api';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { CategoriaBadge } from './CategoriaBadge';
import { etiquetaLabel } from './categorias';

interface ReporteCreadoProps {
  reporte: Reporte;
  onVolver: () => void;
}

const RING = 99.285;
const RING_BORDER = 6;

export function ReporteCreado({ reporte, onVolver }: ReporteCreadoProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.marco} />

      <View style={[styles.contenido, { paddingTop: insets.top + 55 }]}>
        <Svg width={177} height={177} viewBox="0 0 177 177" fill="none">
          <Circle cx={88.5} cy={88.5} r={84.1149} fill="#6ED354" stroke="#C8C8C8" strokeWidth={8.77027} />
          <Path
            d="M49.4324 98.8302L69.9195 126.146L127.966 51.027"
            stroke="white"
            strokeWidth={16.7432}
            strokeLinecap="round"
          />
        </Svg>

        <Text style={styles.titulo}>Reporte Creado</Text>
        <Text style={styles.subtitulo}>Gracias por apoyar a tu comunidad</Text>

        <View style={styles.tarjeta}>
          <View style={styles.anillo}>
            <CategoriaBadge categoria={reporte.categoria} size={RING - RING_BORDER * 2} glyphScale={1.45} />
          </View>
          <Text style={styles.tarjetaTitulo} numberOfLines={2}>
            {reporte.titulo}
          </Text>
          {reporte.tags.length > 0 && (
            <View style={styles.chips}>
              {reporte.tags.map((tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipTexto}>{etiquetaLabel(tag)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={[styles.pie, { bottom: Math.max(insets.bottom, 0) + 41 }]}>
        <Pressable onPress={onVolver} accessibilityRole="button" style={styles.boton}>
          <Text style={styles.botonTexto}>Volver al Mapa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.creadoBackground,
  },
  // Marco punteado de la pantalla del Figma (borde de 6 px, inset de 17 px).
  marco: {
    position: 'absolute',
    top: 18,
    bottom: 18,
    left: 17,
    right: 17,
    borderWidth: 6,
    borderStyle: 'dashed',
    borderColor: '#e0e0e0',
  },
  contenido: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  titulo: {
    marginTop: 26,
    fontFamily: fontFamily.semiBold,
    fontSize: 40,
    lineHeight: 48,
    color: colors.creadoInk,
    textAlign: 'center',
  },
  subtitulo: {
    marginTop: 8,
    fontFamily: fontFamily.regular,
    fontSize: 20,
    lineHeight: 26,
    color: colors.creadoInk,
    textAlign: 'center',
  },
  tarjeta: {
    marginTop: 30,
    width: '100%',
    maxWidth: 311,
    alignItems: 'center',
    paddingTop: 19,
    paddingBottom: 23,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: colors.creadoCard,
  },
  anillo: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: RING_BORDER,
    borderColor: '#bebebe',
    overflow: 'hidden',
  },
  tarjetaTitulo: {
    marginTop: 16,
    fontFamily: fontFamily.medium,
    fontSize: 20,
    lineHeight: 26,
    color: colors.creadoInk,
    textAlign: 'center',
  },
  chips: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14.7,
    paddingVertical: 7.4,
    borderRadius: 999,
    borderWidth: 1.434,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.white,
    elevation: 1,
  },
  chipTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 15.95,
    lineHeight: 23.9,
    color: colors.chipText,
  },
  pie: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  boton: {
    width: 311,
    maxWidth: '85%',
    height: 84,
    borderRadius: 57,
    backgroundColor: colors.creadoButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.white,
  },
});
