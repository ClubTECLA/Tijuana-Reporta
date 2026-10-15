import Svg, { Path } from 'react-native-svg';

// Ícono/Cerrar (Figma, línea 20 px): la X del botón de las hojas.
export function CerrarIcon({ size = 20, color = '#334155' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M5 5L15 15M15 5L5 15" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
