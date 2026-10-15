import Svg, { Path } from 'react-native-svg';

// Ícono/Capas (Figma, línea 20 px): tres rombos apilados del botón de capas y filtros.
export function CapasIcon({ size = 20, color = '#334155' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10.6917 1.81667C10.4745 1.71762 10.2387 1.66637 10 1.66637C9.76134 1.66637 9.52547 1.71762 9.30833 1.81667L2.16667 5.06667C2.01879 5.13187 1.89307 5.23867 1.8048 5.37405C1.71654 5.50943 1.66954 5.66755 1.66954 5.82917C1.66954 5.99078 1.71654 6.14891 1.8048 6.28429C1.89307 6.41967 2.01879 6.52646 2.16667 6.59167L9.31667 9.85C9.5338 9.94904 9.76968 10.0003 10.0083 10.0003C10.247 10.0003 10.4829 9.94904 10.7 9.85L17.85 6.6C17.9979 6.5348 18.1236 6.428 18.2119 6.29262C18.3001 6.15724 18.3471 5.99911 18.3471 5.8375C18.3471 5.67589 18.3001 5.51776 18.2119 5.38238C18.1236 5.247 17.9979 5.1402 17.85 5.075L10.6917 1.81667Z"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.3333 14.7083L10.6917 18.175C10.4745 18.274 10.2387 18.3253 10 18.3253C9.76134 18.3253 9.52547 18.274 9.30833 18.175L1.66667 14.7083"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.3333 10.5417L10.6917 14.0083C10.4745 14.1074 10.2387 14.1586 10 14.1586C9.76134 14.1586 9.52547 14.1074 9.30833 14.0083L1.66667 10.5417"
        stroke={color}
        strokeWidth={1.66667}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
