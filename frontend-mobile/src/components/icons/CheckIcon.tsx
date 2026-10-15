import Svg, { Path } from 'react-native-svg';

/** Dibuja una marca de verificación con tamaño y color configurables. */
export function CheckIcon({ size = 24, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
