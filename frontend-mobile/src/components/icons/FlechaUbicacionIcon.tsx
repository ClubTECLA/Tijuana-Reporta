import Svg, { Path } from 'react-native-svg';

// Flecha de navegación en línea del botón "Permitir ubicación" (Figma 1). La rellena del mapa es
// `NavegacionIcon`.
export function FlechaUbicacionIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.5 9.16667L18.3333 1.66667L10.8333 17.5L9.16667 10.8333L2.5 9.16667Z"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
