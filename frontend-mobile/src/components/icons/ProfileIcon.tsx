import Svg, { Path } from 'react-native-svg';

export function ProfileIcon({ size = 19.2769, color = '#9db2ce' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 19.2769 19.2769" fill="none">
      <Path
        d="M9.63843 9.63843C11.8564 9.63843 13.6544 7.8404 13.6544 5.62242C13.6544 3.40443 11.8564 1.6064 9.63843 1.6064C7.42045 1.6064 5.62242 3.40443 5.62242 5.62242C5.62242 7.8404 7.42045 9.63843 9.63843 9.63843Z"
        stroke={color}
        strokeWidth={1.2048}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5379 17.6704C16.5379 14.5621 13.4456 12.048 9.63843 12.048C5.83125 12.048 2.73892 14.5621 2.73892 17.6704"
        stroke={color}
        strokeWidth={1.2048}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
