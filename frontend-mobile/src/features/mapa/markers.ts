import { colors } from '@/theme/colors';

// Paleta local de las categorías para las pantallas que aún no leen el color del catálogo del backend
// (flujo de crear, alertas). Los iconos ya no viven aquí: ver `features/categorias/iconosCategoria.ts`.
export interface MarkerSpec {
  color: string;
}

export const markerSpecs: Record<string, MarkerSpec> = {
  socavon: { color: '#EF6C33' },
  peligro: { color: '#FF0000' },
  drenaje: { color: '#0891B2' },
  luz: { color: '#EFCD33' },
  deslave: { color: '#662D01' },
  arbol: { color: '#2E8B57' },
  inundacion: { color: '#2F6FE0' },
  incendio: { color: '#D32F2F' },
  servicios: { color: colors.primary },
  otro: { color: colors.primary },
};
