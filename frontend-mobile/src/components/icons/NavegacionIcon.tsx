import Svg, { Path } from 'react-native-svg';

// Flecha de "ir a mi ubicación" (Figma 10 · ubicacion-actual).
export function NavegacionIcon({ size = 19.8, color = '#5482d3' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.8001 19.8001" fill="none">
      <Path
        d="M9.90009 9.45003H0.900089L18.9001 0.900028L9.90009 18.9V9.45003Z"
        fill={color}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
