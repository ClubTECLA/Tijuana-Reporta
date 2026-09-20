import type { CategoriaReporte } from '@/types/api';

export const CATEGORIA_LABEL: Record<CategoriaReporte, string> = {
  socavon: 'Socavón',
  peligro: 'Peligro',
  drenaje: 'Drenaje',
  luz: 'Luz',
  deslave: 'Deslave',
  arbol: 'Árbol',
  inundacion: 'Inundación',
  servicios: 'Servicios',
  otro: 'Otro',
};

// Categorías que ofrece el diseño de "Reportar un incidente", en el orden del
// Figma: 6 de las 9 de `CategoriaReporte` (el Figma no incluye peligro,
// servicios ni otro en el picker). Las cuatro primeras van en la hoja y
// "+ Ver mas" muestra estas seis.
export const CATEGORIAS_PICKER: CategoriaReporte[] = [
  'inundacion',
  'deslave',
  'arbol',
  'socavon',
  'luz',
  'drenaje',
];
export const CATEGORIAS_VISIBLES = 4;

// El diseño muestra "Tráfico" y "Muertos" como chips de la descripción. El
// resto es provisional hasta definir el catálogo de etiquetas.
export const ETIQUETAS = ['tráfico', 'muertos', 'heridos', 'cables', 'bloqueo', 'peligroso'];
export const ETIQUETAS_VISIBLES = 2;

export function etiquetaLabel(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function tituloReporte(categoria: CategoriaReporte, direccion: string | null): string {
  const label = CATEGORIA_LABEL[categoria];
  // Solo la calle: la dirección completa ("calle, ciudad") no cabe en el título.
  const lugar = direccion?.split(',')[0].trim();
  return lugar ? `${label} en ${lugar}` : label;
}
