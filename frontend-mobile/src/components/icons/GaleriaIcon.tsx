import Svg, { Circle, Path } from 'react-native-svg';

// Galería: marco con sol y montañas, mismo trazo redondeado que CameraIcon.
export function GaleriaIcon({ size = 28, color = '#5f6b7a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3.5H19A1.5 1.5 0 0 1 20.5 5V19A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={8.5} cy={8.5} r={1.75} stroke={color} strokeWidth={2} />
      <Path
        d="M3.5 16.5L8.5 11.5L12.5 15.5L15 13L20.5 18.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
