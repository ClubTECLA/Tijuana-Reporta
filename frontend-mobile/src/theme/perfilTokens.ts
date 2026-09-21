// Tokens tomados (aproximados) del Figma de Perfil (C19-C22).
// Ajustar con los valores exactos de Dev Mode. Se unificarán con src/theme cuando entre a main.
export const perfilColors = {
  screenBg: '#F0F4F9',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  sectionLabel: '#64748B',
  primary: '#2478E5',
  primaryTint: '#E8F1FD',
  danger: '#DC2626',
  dangerTint: '#FDE8E8',
  chevron: '#4B5563',
  divider: '#E5E7EB',
};

export const perfilRadius = { card: 20, pill: 999, icon: 12 };

export type EstadoReporte =
  | 'en_revision'
  | 'pendiente'
  | 'resuelto'
  | 'descartado'
  | 'agrupado';

export const estadoStyles: Record<
  EstadoReporte,
  { label: string; bg: string; fg: string; dot: string }
> = {
  en_revision: { label: 'En revisión', bg: '#FEF3C7', fg: '#92400E', dot: '#D97706' },
  pendiente: { label: 'Pendiente', bg: '#E5E7EB', fg: '#374151', dot: '#6B7280' },
  resuelto: { label: 'Resuelto', bg: '#E5E7EB', fg: '#374151', dot: '#6B7280' },
  descartado: { label: 'Descartado', bg: '#FDE2E2', fg: '#B91C1C', dot: '#DC2626' },
  agrupado: { label: 'Agrupado', bg: '#E8F1FD', fg: '#1D6FE0', dot: '#2478E5' },
};
