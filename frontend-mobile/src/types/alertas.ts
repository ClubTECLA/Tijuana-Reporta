export type CategoriaAlerta = 'inundacion' | 'deslave' | 'drenaje' | 'arbol' | 'socavon' | 'luz';

export interface OpcionCategoria {
  id: CategoriaAlerta;
  label: string;
  color: string;
}

export const CATEGORIAS: OpcionCategoria[] = [
  { id: 'inundacion', label: 'Inundación', color: '#2478E5' },
  { id: 'deslave', label: 'Deslave', color: '#7C2D12' },
  { id: 'drenaje', label: 'Drenaje', color: '#0E7490' },
  { id: 'arbol', label: 'Árbol', color: '#15803D' },
  { id: 'socavon', label: 'Socavón', color: '#C2410C' },
  { id: 'luz', label: 'Luz', color: '#CA8A04' },
];