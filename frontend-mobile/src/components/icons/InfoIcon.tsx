import Svg, { Circle, Path } from 'react-native-svg';

/** Dibuja un símbolo de información dentro de un círculo con tamaño y color configurables. */
export function InfoIcon({ size = 24, color = '#64748b' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M12 11v5M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
