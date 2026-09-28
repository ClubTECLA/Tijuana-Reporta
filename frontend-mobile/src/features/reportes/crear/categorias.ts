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

// Etiquetas predefinidas de "Información adicional", por categoría (Figma 16/17: chips con un punto
// del color de su categoría). La primera de cada lista es la "etiqueta de categoría": se agrega sola
// al elegir la categoría. Lo demás es provisional hasta definir el catálogo con diseño y backend.
// Cada etiqueta pertenece a una sola categoría (de ahí su color); se guarda tal cual en `Reporte.tags`.
export const ETIQUETAS_POR_CATEGORIA: Partial<Record<CategoriaReporte, string[]>> = {
  inundacion: ['inundación', 'tráfico', 'vehículo atrapado', 'casas afectadas'],
  deslave: ['deslave', 'bloqueo', 'casas en riesgo'],
  arbol: ['árbol caído', 'cables', 'poste caído'],
  socavon: ['hundimiento', 'profundo', 'peligroso'],
  luz: ['sin luz', 'apagón', 'cables expuestos'],
  drenaje: ['drenaje tapado', 'desborde', 'mal olor'],
};

export interface EtiquetaDeCategoria {
  id: string;
  categoria: CategoriaReporte;
}

export const etiquetasDe = (categoria: CategoriaReporte): EtiquetaDeCategoria[] =>
  (ETIQUETAS_POR_CATEGORIA[categoria] ?? []).map((id) => ({ id, categoria }));

/** Etiqueta que se crea sola al elegir la categoría. */
export const etiquetaPrincipal = (categoria: CategoriaReporte): string | undefined =>
  ETIQUETAS_POR_CATEGORIA[categoria]?.[0];

export function etiquetaLabel(tag: string): string {
  const texto = tag.replaceAll('_', ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function tituloReporte(categoria: CategoriaReporte, direccion: string | null): string {
  const label = CATEGORIA_LABEL[categoria];
  // Solo la calle: la dirección completa ("calle, ciudad") no cabe en el título.
  const lugar = direccion?.split(',')[0].trim();
  return lugar ? `${label} en ${lugar}` : label;
}
