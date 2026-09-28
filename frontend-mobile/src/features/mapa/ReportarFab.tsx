import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';

// Medidas del botón de Figma: círculo de 84 dentro de un canvas de 171.093
// que incluye el resplandor rojo; el círculo está centrado en (85.5467, 99.5467).
const CANVAS = 171.093;
const SIZE = 84;
const OFFSET_X = 43.5467;
const OFFSET_Y = 57.5467;
// Píldora "Reportar" del mapa fijo (Figma 10).
const ANCHO_EXPANDIDO = 228;
const ALTO_EXPANDIDO = 60;

interface ReportarFabProps {
  onPress: () => void;
  /** Mapa quieto: el botón se ensancha y muestra "Reportar". En movimiento queda solo el círculo. */
  expandido?: boolean;
}

export function ReportarFab({ onPress, expandido = false }: ReportarFabProps) {
  const progreso = useRef(new Animated.Value(expandido ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progreso, { toValue: expandido ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [expandido, progreso]);

  const ancho = progreso.interpolate({ inputRange: [0, 1], outputRange: [SIZE, ANCHO_EXPANDIDO] });
  const alto = progreso.interpolate({ inputRange: [0, 1], outputRange: [SIZE, ALTO_EXPANDIDO] });
  const opacidadCirculo = progreso.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: 'clamp' });
  const opacidadPildora = progreso.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Reportar incidente"
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Animated.View style={{ width: ancho, height: alto }}>
        <Animated.View style={[styles.circulo, { opacity: opacidadCirculo }]} pointerEvents="none">
          <Svg width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`} style={styles.canvas}>
            <Defs>
              <RadialGradient id="glow" cx={85.5467} cy={85.5467} r={85.5} gradientUnits="userSpaceOnUse">
                <Stop offset={0} stopColor={colors.reportar} stopOpacity={0.15} />
                <Stop offset={0.25} stopColor={colors.reportar} stopOpacity={0.13} />
                <Stop offset={0.5} stopColor={colors.reportar} stopOpacity={0.075} />
                <Stop offset={0.75} stopColor={colors.reportar} stopOpacity={0.025} />
                <Stop offset={1} stopColor={colors.reportar} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={85.5467} cy={85.5467} r={85.5} fill="url(#glow)" />
            <Circle cx={85.5467} cy={99.5467} r={42} fill={colors.reportar} />
            <Path
              d="M85.0467 92.2689V101.825M85.0467 108.991V109.015M85.0467 75.5467L106.547 113.769H63.5467L85.0467 75.5467Z"
              stroke="white"
              strokeWidth={4.53889}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.pildora, { opacity: opacidadPildora }]} pointerEvents="none">
          <AlertTriangleIcon size={22} />
          <Text style={styles.texto} numberOfLines={1}>
            Reportar
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  // El círculo de 84 queda centrado en el botón mientras éste se ensancha.
  circulo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: SIZE,
    height: SIZE,
    marginLeft: -SIZE / 2,
    marginTop: -SIZE / 2,
  },
  canvas: {
    position: 'absolute',
    left: -OFFSET_X,
    top: -OFFSET_Y,
  },
  pildora: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 999,
    backgroundColor: colors.reportRed,
    elevation: 4,
    shadowColor: colors.reportRed,
  },
  texto: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    color: colors.white,
  },
});
