import Svg, { Path } from 'react-native-svg';

// Triángulo de peligro del botón "Reportar" expandido (Figma 10).
export function AlertTriangleIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M10 3L18 17H2L10 3Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M10 8V12M10 14.4V14.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}
