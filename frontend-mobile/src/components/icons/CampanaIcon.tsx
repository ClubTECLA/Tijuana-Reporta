import Svg, { Path } from 'react-native-svg';

// Ícono/Campana (Figma, línea 20 px).
export function CampanaIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 6.66667C5 5.34058 5.52678 4.06881 6.46447 3.13113C7.40215 2.19345 8.67392 1.66667 10 1.66667C11.3261 1.66667 12.5979 2.19345 13.5355 3.13113C14.4732 4.06881 15 5.34058 15 6.66667C15 12.5 17.5 14.1667 17.5 14.1667H2.5C2.5 14.1667 5 12.5 5 6.66667Z"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.58333 17.5C8.72282 17.7537 8.92787 17.9653 9.17708 18.1127C9.42628 18.26 9.71048 18.3378 10 18.3378C10.2895 18.3378 10.5737 18.26 10.8229 18.1127C11.0721 17.9653 11.2772 17.7537 11.4167 17.5"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
