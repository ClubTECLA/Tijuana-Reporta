import Svg, { Path } from 'react-native-svg';

export function SendIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M18.3333 1.66667L9.16667 10.8333" stroke={color} strokeWidth={1.66667} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M18.3333 1.66667L12.5 18.3333L9.16667 10.8333L1.66667 7.5L18.3333 1.66667Z"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
