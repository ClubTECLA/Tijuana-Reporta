import type { CategoriaFiltro } from './types';

export const categoriaActiva = (seleccion: CategoriaFiltro[] | null, slug: CategoriaFiltro): boolean =>
  seleccion === null || seleccion.includes(slug);

/** Prende/apaga una categoría. Parte de `null` (todas) y vuelve a `null` al completar el catálogo; el
 * resultado sale siempre en el orden de `catalogo` (slugs en el orden del backend). */
export function alternarCategoria(
  seleccion: CategoriaFiltro[] | null,
  slug: CategoriaFiltro,
  catalogo: readonly CategoriaFiltro[],
): CategoriaFiltro[] | null {
  const resultado = catalogo.filter((c) => (c === slug ? !categoriaActiva(seleccion, c) : categoriaActiva(seleccion, c)));
  return resultado.length === catalogo.length ? null : resultado;
}
