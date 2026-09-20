import { Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme/colors';

// Medidas del botón de Figma: círculo de 84 dentro de un canvas de 171.093
// que incluye el resplandor rojo; el círculo está centrado en (85.5467, 99.5467).
const CANVAS = 171.093;
const SIZE = 84;
const OFFSET_X = 43.5467;
const OFFSET_Y = 57.5467;

interface ReportarFabProps {
  onPress: () => void;
}

export function ReportarFab({ onPress }: ReportarFabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Reportar incidente"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Svg
        width={CANVAS}
        height={CANVAS}
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        style={styles.canvas}
        pointerEvents="none"
      >
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    overflow: 'visible',
  },
  pressed: {
    opacity: 0.85,
  },
  canvas: {
    position: 'absolute',
    left: -OFFSET_X,
    top: -OFFSET_Y,
  },
});
