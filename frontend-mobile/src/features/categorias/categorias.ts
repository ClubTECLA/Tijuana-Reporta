import { colors } from '@/theme/colors';
import type { IncidenteApi } from '../reportes/mappers';

/** Categoría tal como la pinta la UI. La fuente de verdad es el catálogo del backend (`GET /incidentes`). */
export interface CategoriaUI {
  /** `incidentes.nombre` del backend: luz, socavon, arbol, drenaje, deslave, inundacion, incendio… */
  slug: string;
  id: number;
  etiqueta: string;
  /** '#RRGGBB' del backend. */
  color: string;
}

/** Slugs con glifo propio en la app (assets/map/glyphs y vectores de `markers.ts`). El backend no trae icono. */
export const ICONOS_LOCALES = ['socavon', 'drenaje', 'luz', 'deslave', 'arbol', 'inundacion'] as const;
export type IconoCategoria = (typeof ICONOS_LOCALES)[number] | 'generico';

export interface CategoriaResuelta {
  etiqueta: string;
  color: string;
  icono: IconoCategoria;
}

/** Activas, en el orden del backend (por id). */
export function categoriasDeCatalogo(incidentes: IncidenteApi[]): CategoriaUI[] {
  return incidentes
    .filter((i) => i.esta_activo)
    .map((i) => ({ slug: i.nombre, id: i.id, etiqueta: i.etiqueta, color: i.color }))
    .sort((a, b) => a.id - b.id);
}

// Respaldo mientras el catálogo no carga (o falla): las 6 categorías del picker del Figma, en su orden,
// con etiquetas y colores del backend. Así la hoja de filtros nunca sale vacía ni espera un spinner.
export const CATEGORIAS_RESPALDO: readonly CategoriaUI[] = [
  { slug: 'inundacion', id: 6, etiqueta: 'Inundación', color: '#1E88E5' },
  { slug: 'deslave', id: 5, etiqueta: 'Deslave', color: '#E65100' },
  { slug: 'drenaje', id: 4, etiqueta: 'Drenaje', color: '#00897B' },
  { slug: 'arbol', id: 3, etiqueta: 'Árbol', color: '#2E7D32' },
  { slug: 'socavon', id: 2, etiqueta: 'Socavón', color: '#8D6E63' },
  { slug: 'luz', id: 1, etiqueta: 'Luz', color: '#F5C518' },
];

const esIconoLocal = (slug: string): slug is (typeof ICONOS_LOCALES)[number] =>
  (ICONOS_LOCALES as readonly string[]).includes(slug);

/** Etiqueta y color del catálogo + icono local. Slug ausente, 'otro' o desconocido: Otro / gris / genérico. */
export function resolverCategoria(slug: string | undefined, catalogo: readonly CategoriaUI[]): CategoriaResuelta {
  const categoria = slug === undefined ? undefined : catalogo.find((c) => c.slug === slug);
  if (!categoria) return { etiqueta: 'Otro', color: colors.textMuted, icono: 'generico' };
  return {
    etiqueta: categoria.etiqueta,
    color: categoria.color,
    icono: esIconoLocal(categoria.slug) ? categoria.slug : 'generico',
  };
}
