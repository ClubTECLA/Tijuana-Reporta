import Svg, { Path } from 'react-native-svg';

export function MapIcon({ size = 24, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4zM8 2v16M16 6v16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
