import Svg, { Path } from 'react-native-svg';

export function ArrowRightIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21.12 21.12" fill="none">
      <Path
        d="M4.4 10.56H16.72M13.2 7.04L16.72 10.56L13.2 14.08"
        stroke={color}
        strokeWidth={1.76}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
