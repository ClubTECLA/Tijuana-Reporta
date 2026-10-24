import Svg, { G, Path } from 'react-native-svg';
import { iconoSvg, pinturaDeIcono, transformDeIcono } from './iconosCategoria';

interface IconoCategoriaProps {
  /** `incidentes.nombre` del backend; uno desconocido pinta el triángulo de alerta. */
  slug: string | undefined;
  size: number;
  color?: string;
}

// Icono de categoría: los mismos de la web (`iconosCategoria.ts`), dibujados con react-native-svg.
export function IconoCategoria({ slug, size, color = 'white' }: IconoCategoriaProps) {
  const icono = iconoSvg(slug);
  const pintura = pinturaDeIcono(icono, color);
  return (
    <Svg width={size} height={size} viewBox={icono.viewBox}>
      {icono.paths.map((d, i) => (
        <Path key={i} d={d} {...pintura} />
      ))}
    </Svg>
  );
}

interface IconoCategoriaEnCanvasProps extends IconoCategoriaProps {
  x: number;
  y: number;
}

/** Variante para dibujar el icono dentro de un <Svg> que ya existe (marcador del mapa), en coordenadas de su canvas. */
export function IconoCategoriaEnCanvas({ slug, size, color = 'white', x, y }: IconoCategoriaEnCanvasProps) {
  const icono = iconoSvg(slug);
  const pintura = pinturaDeIcono(icono, color);
  return (
    <G transform={transformDeIcono(icono, x, y, size)}>
      {icono.paths.map((d, i) => (
        <Path key={i} d={d} {...pintura} />
      ))}
    </G>
  );
}
