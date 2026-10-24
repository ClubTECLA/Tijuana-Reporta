import type { IconoCategoria } from './categorias';

// Geometría de los iconos de categoría: son los mismos que usa la web (react-icons, frontend-web/src/types/categories.ts),
// copiados como datos porque los componentes de react-icons dibujan <svg> del DOM y no corren en React Native.
// Sets de origen (react-icons 5.7.0): Lucide, Material Design y Game Icons (CC BY 3.0: exige atribución).
export interface IconoSvg {
  viewBox: string;
  /** Lucide se dibuja en trazo (fill none); Material y Game Icons, rellenos. */
  trazo: boolean;
  paths: readonly string[];
}

export const ICONOS_CATEGORIA: Record<IconoCategoria, IconoSvg> = {
  // Material Design (MdFlood)
  inundacion: {
    viewBox: '0 0 24 24',
    trazo: false,
    paths: [
      'M18.67 19c-1.95 0-2.09 1-3.33 1-1.19 0-1.42-1-3.33-1-1.95 0-2.1 1-3.34 1s-1.38-1-3.33-1-2.1 1-3.34 1v2c1.95 0 2.11-1 3.34-1 1.24 0 1.38 1 3.33 1s2.1-1 3.34-1c1.22 0 1.4 1 3.33 1s2.1-1 3.33-1c1.22 0 1.4 1 3.33 1v-2c-1.24 0-1.38-1-3.33-1M8.68 17.5c1.95 0 2.09-1 3.33-1 1.19 0 1.42 1 3.33 1 1.95 0 2.09-1 3.33-1 1.19 0 1.4.98 3.31 1v-2c-.63 0-1-.28-1.48-.55l-2.02-7.53 2.09.85.74-1.86L9.78 2 2 11.61l1.57 1.23 1.39-1.78.93 3.48c-.18-.02-.35-.05-.56-.05-1.95 0-2.09 1-3.33 1v2c1.9 0 2.17-1 3.35-1 1.19.01 1.42 1.01 3.33 1.01m5.36-7.32 1.42 5.31c-1.34.09-1.47-.99-3.47-.99-.36 0-.65.04-.91.1l-.91-3.39z',
    ],
  },
  // Material Design (MdLandslide)
  deslave: {
    viewBox: '0 0 24 24',
    trazo: false,
    paths: [
      'm15.47 13.79-2.58-1.03L6 15.05l-4-1.54v2.1l4 1.34zM10.57 11.42 8 8H2v3.61l4 1.34zM6 19.05l-4-1.33V22h20l-4.97-6.62zM17 6V1l-5-1-3 2v4l3 2zM18.5 7 16 9v3l2.5 2 4.5-2V8z',
    ],
  },
  // Lucide (LuTreeDeciduous)
  arbol: {
    viewBox: '0 0 24 24',
    trazo: true,
    paths: [
      'M8 19a4 4 0 0 1-2.24-7.32A3.5 3.5 0 0 1 9 6.03V6a3 3 0 1 1 6 0v.04a3.5 3.5 0 0 1 3.24 5.65A4 4 0 0 1 16 19Z',
      'M12 19v3',
    ],
  },
  // Game Icons (GiHole)
  socavon: {
    viewBox: '0 0 512 512',
    trazo: false,
    paths: [
      'M256 151c-62.9 0-119.9 10.8-161.94 28.8-21.03 9.1-38.38 19.9-50.86 32.5C30.71 225 23 239.9 23 256s7.71 31 20.2 43.7c12.48 12.6 29.83 23.4 50.86 32.5C136.1 350.2 193.1 361 256 361c62.9 0 119.9-10.8 161.9-28.8 21.1-9.1 38.4-19.9 50.9-32.5C481.3 287 489 272.1 489 256s-7.7-31-20.2-43.7c-12.5-12.6-29.8-23.4-50.9-32.5-42-18-99-28.8-161.9-28.8zm0 43c82.7 0 165.5 21.2 215 63.6-.5 9.9-5.3 19.6-15 29.4-10.2 10.4-25.6 20.2-45.2 28.6-39 16.7-94 27.4-154.8 27.4-60.8 0-115.8-10.7-154.8-27.4-19.55-8.4-35.01-18.2-45.19-28.6-9.65-9.8-14.48-19.5-14.96-29.4C90.54 215.2 173.3 194 256 194z',
    ],
  },
  // Lucide (LuGrid3X3)
  drenaje: {
    viewBox: '0 0 24 24',
    trazo: true,
    paths: [
      'M5 3H19A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3Z',
      'M3 9h18',
      'M3 15h18',
      'M9 3v18',
      'M15 3v18',
    ],
  },
  // Lucide (LuZap)
  luz: {
    viewBox: '0 0 24 24',
    trazo: true,
    paths: [
      'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    ],
  },
  // Material Design (MdLocalFireDepartment)
  incendio: {
    viewBox: '0 0 24 24',
    trazo: false,
    paths: [
      'm12 12.9-2.13 2.09c-.56.56-.87 1.29-.87 2.07C9 18.68 10.35 20 12 20s3-1.32 3-2.94c0-.78-.31-1.52-.87-2.07z',
      'm16 6-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 6 4 13c0 2.92 1.56 5.47 3.89 6.86-.56-.79-.89-1.76-.89-2.8 0-1.32.52-2.56 1.47-3.5L12 10.1l3.53 3.47c.95.93 1.47 2.17 1.47 3.5 0 1.02-.31 1.96-.85 2.75 1.89-1.15 3.29-3.06 3.71-5.3.66-3.55-1.07-6.9-3.86-8.52',
    ],
  },
  // Lucide (LuTriangleAlert)
  generico: {
    viewBox: '0 0 24 24',
    trazo: true,
    paths: [
      'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      'M12 9v4',
      'M12 17h.01',
    ],
  },
};

/** Icono de un slug del catálogo; ausente o desconocido: el triángulo de alerta genérico. */
export function iconoSvg(slug: string | undefined): IconoSvg {
  return slug !== undefined && slug in ICONOS_CATEGORIA && slug !== 'generico'
    ? ICONOS_CATEGORIA[slug as IconoCategoria]
    : ICONOS_CATEGORIA.generico;
}

/** Cómo se pinta un icono con `color`: Lucide en trazo de grosor 2 (unidades del viewBox) y el resto relleno. */
export function pinturaDeIcono(icono: IconoSvg, color: string) {
  return icono.trazo
    ? ({ fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const)
    : ({ fill: color } as const);
}
