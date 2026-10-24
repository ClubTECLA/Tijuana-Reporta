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

/** Devuelve las etiquetas con su categoría de origen, o una lista vacía si no hay etiquetas. */
export const etiquetasDe = (categoria: CategoriaReporte): EtiquetaDeCategoria[] =>
  (ETIQUETAS_POR_CATEGORIA[categoria] ?? []).map((id) => ({ id, categoria }));

/** Etiqueta que se crea sola al elegir la categoría. */
export const etiquetaPrincipal = (categoria: CategoriaReporte): string | undefined =>
  ETIQUETAS_POR_CATEGORIA[categoria]?.[0];

/**
 * Selección única: el backend solo admite una categoría por reporte. Tocar otra reemplaza a la
 * elegida; tocar la ya elegida la deselecciona (así se puede limpiar). Devuelve 0 o 1 elemento.
 */
export const elegirCategoria = (actual: CategoriaReporte[], categoria: CategoriaReporte): CategoriaReporte[] =>
  actual.length === 1 && actual[0] === categoria ? [] : [categoria];

/**
 * Aplica `elegirCategoria` al formulario y mantiene coherentes las etiquetas: salen las de la
 * categoría que se deja (o se quita) y entra la etiqueta principal de la nueva.
 */
export function cambiarCategoria(
  form: { categorias: CategoriaReporte[]; tags: string[] },
  categoria: CategoriaReporte,
): { categorias: CategoriaReporte[]; tags: string[] } {
  const categorias = elegirCategoria(form.categorias, categoria);
  const salientes = form.categorias.filter((c) => !categorias.includes(c)).flatMap(etiquetasDe).map((e) => e.id);
  const tags = form.tags.filter((t) => !salientes.includes(t));
  const principal = categorias.length > 0 ? etiquetaPrincipal(categorias[0]) : undefined;
  return { categorias, tags: principal && !tags.includes(principal) ? [...tags, principal] : tags };
}

/**
 * Categorías de la grilla compacta. Si la elegida no está entre las visibles (se eligió desde
 * "+ Ver mas"), toma el último lugar para que siga viéndose seleccionada.
 */
export function categoriasVisibles(elegidas: CategoriaReporte[]): CategoriaReporte[] {
  const base = CATEGORIAS_PICKER.slice(0, CATEGORIAS_VISIBLES);
  const fuera = elegidas.find((c) => !base.includes(c));
  return fuera ? [...base.slice(0, CATEGORIAS_VISIBLES - 1), fuera] : base;
}

/** Convierte guiones bajos en espacios y pone en mayúscula la primera letra de la etiqueta. */
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
