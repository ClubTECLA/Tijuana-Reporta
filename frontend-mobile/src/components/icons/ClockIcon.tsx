import Svg, { Circle, Path } from 'react-native-svg';

/** Dibuja un reloj para indicar antigüedad o búsquedas recientes con tamaño y color configurables. */
export function ClockIcon({ size = 20, color = '#475569' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={7.5} stroke={color} strokeWidth={1.5} />
      <Path d="M10 5.83v4.17l2.92 1.67" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
