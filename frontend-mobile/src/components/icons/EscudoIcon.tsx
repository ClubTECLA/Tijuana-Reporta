import Svg, { Path } from 'react-native-svg';

// Ícono/Escudo (Figma, línea 20 px).
export function EscudoIcon({ size = 20, color = '#b7770f' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 2.5L16 5V9.5C16 13.5 13.5 16.1 10 17.5C6.5 16.1 4 13.5 4 9.5V5L10 2.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M7 10L9 12L13 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
