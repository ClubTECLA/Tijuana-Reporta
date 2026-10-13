import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

// Medidas del Figma (pantallas 1 y 2): el lienzo de 440 × 430 se escala al ancho del dispositivo
// para que lo que va encima del mapa (halo de ubicación, alerta de ejemplo) quede en su lugar.
const LIENZO_ANCHO = 440;
const LIENZO_ALTO = 430;

/** Mapa de fondo que se desvanece a blanco, con `children` dibujados en coordenadas del Figma. */
export function IlustracionMapa({ children }: { children?: ReactNode }) {
  const { width } = useWindowDimensions();
  const escala = width / LIENZO_ANCHO;

  return (
    <View style={[styles.marco, { width, height: LIENZO_ALTO * escala }]} pointerEvents="none">
      <View style={[styles.lienzo, { transform: [{ scale: escala }] }]}>
        <Image source={require('../../../assets/bienvenida/mapa-ilustracion.png')} style={styles.mapa} resizeMode="stretch" />
        <LinearGradient
          colors={['rgba(255,255,255,0)', colors.white]}
          locations={[0.35, 1]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </View>
  );
}

/** Halo azul con el punto de "tu ubicación" (Figma 1). */
export function HaloUbicacion() {
  return (
    <>
      <View style={[styles.circulo, styles.haloExterno]} />
      <View style={[styles.circulo, styles.haloInterno]} />
      <View style={[styles.circulo, styles.punto]} />
    </>
  );
}

/** Notificación de ejemplo "Incidente cerca de ti" (Figma 2). */
export function AlertaEjemplo() {
  return (
    <View style={styles.alerta}>
      <Text style={styles.alertaTitulo}>Incidente cerca de ti</Text>
      <View style={styles.alertaIcono}>
        <Svg width={46.882} height={46.882} viewBox="0 0 46.882 46.882" fill="none">
          <Rect width={46.882} height={46.882} rx={23.441} fill={colors.alertaEjemploIcono} />
          <Path
            d="M23.2347 19.4668V25.3282M23.2347 29.7242V29.7388M23.2347 9.20951L36.4227 32.6548H10.0467L23.2347 9.20951Z"
            stroke={colors.white}
            strokeWidth={2.78413}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={styles.alertaTexto}>Estás a 300 m de un encharcamiento reportado en Zona Río.</Text>
      <Text style={styles.alertaHace}>hace 1 min</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  marco: {
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  lienzo: {
    width: LIENZO_ANCHO,
    height: LIENZO_ALTO,
    transformOrigin: 'top left',
  },
  // El mapa del Figma se recorta y estira dentro del lienzo (200 % × 222 %).
  mapa: {
    position: 'absolute',
    left: -LIENZO_ANCHO * 0.5,
    top: -LIENZO_ALTO * 0.4444,
    width: LIENZO_ANCHO * 2,
    height: LIENZO_ALTO * 2.2222,
  },

  circulo: {
    position: 'absolute',
  },
  haloExterno: {
    left: 100,
    top: 90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.bienvenidaUbicacionHalo,
  },
  haloInterno: {
    left: 140,
    top: 130,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.bienvenidaUbicacionHaloInterno,
  },
  punto: {
    left: 203,
    top: 193,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 6,
    borderColor: colors.white,
    backgroundColor: colors.brand,
    elevation: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },

  alerta: {
    position: 'absolute',
    left: 41,
    top: 150,
    width: 358,
    height: 109,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.alertaEjemploBorde,
    backgroundColor: colors.alertaEjemplo,
    elevation: 10,
    shadowColor: colors.alertaEjemploSombra,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 7.5,
  },
  alertaTitulo: {
    position: 'absolute',
    left: 24,
    top: 13,
    width: 237,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 25,
    color: colors.white,
  },
  alertaIcono: {
    position: 'absolute',
    left: 10,
    top: 47,
  },
  alertaTexto: {
    position: 'absolute',
    left: 70,
    top: 48,
    width: 252,
    fontFamily: fontFamily.regular,
    fontSize: 12,
    lineHeight: 12,
    color: colors.white,
  },
  alertaHace: {
    position: 'absolute',
    left: 70,
    top: 75,
    fontFamily: fontFamily.bold,
    fontSize: 10,
    lineHeight: 25,
    color: colors.alertaEjemploHace,
  },
});
