import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

// "Markers / Spotlight Marker" del Figma (27×43): gota roja con punto central.
export function PinDestacadoIcon({ width = 27 }: { width?: number }) {
  return (
    <Svg width={width} height={width * (43 / 27)} viewBox="0 0 27 43" fill="none">
      <Defs>
        <LinearGradient id="pinShine" x1={13.5} y1={1} x2={13.5} y2={39} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor="white" />
          <Stop offset={1} stopColor="white" stopOpacity={0.35} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={13.5} cy={39.5} rx={4.5} ry={2.5} fill="black" fillOpacity={0.12} />
      <Path
        d="M13.5 1C20.4036 1 26 6.59644 26 13.5C26 16.3142 25.0694 18.9108 23.5 21C21 24.5 14.5 29 14.5 38C14.5 38.5523 14.0523 39 13.5 39C12.9477 39 12.5 38.5523 12.5 38C12.5 29 6 24.5 3.5 21C1.93058 18.9108 1 16.3142 1 13.5C1 6.59644 6.59644 1 13.5 1Z"
        fill="#EA352B"
      />
      <Path
        d="M13.5 1C20.4036 1 26 6.59644 26 13.5C26 16.3142 25.0694 18.9108 23.5 21C21 24.5 14.5 29 14.5 38C14.5 38.5523 14.0523 39 13.5 39C12.9477 39 12.5 38.5523 12.5 38C12.5 29 6 24.5 3.5 21C1.93058 18.9108 1 16.3142 1 13.5C1 6.59644 6.59644 1 13.5 1Z"
        stroke="url(#pinShine)"
        strokeWidth={1}
      />
      <Circle cx={13.5} cy={13.5} r={4.5} fill="black" fillOpacity={0.4} />
    </Svg>
  );
}
