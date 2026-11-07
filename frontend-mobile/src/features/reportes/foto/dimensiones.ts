/** Lado largo máximo (px) con el que se sube una foto: el README de multimedia pide entre 1600 y 2000. */
export const LADO_MAX_PX = 1600;

/** Cómo reducir una foto para que su lado largo no pase de `ladoMax`, conservando la proporción.
 * `null` si ya cabe. Solo se indica un lado: el otro lo calcula el manipulador de imágenes. */
export function redimensionarA(
  ancho: number,
  alto: number,
  ladoMax: number = LADO_MAX_PX,
): { width: number } | { height: number } | null {
  if (Math.max(ancho, alto) <= ladoMax) return null;
  return ancho >= alto ? { width: ladoMax } : { height: ladoMax };
}
