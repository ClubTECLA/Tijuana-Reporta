interface CategoryChipProps {
  label: string
  count?: number
  isSelected?: boolean
  onPress?: () => void
}

// "Web/Chip de filtro" del Figma (tipo Píldora): blanco con borde, o azul de marca cuando está seleccionado.
export default function CategoryChip ({ label, count, isSelected = false, onPress }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`
        inline-flex items-center gap-2 rounded-full py-2.5 pl-3.5 pr-4
        text-sm font-semibold drop-shadow-card transition-colors duration-200
        ${isSelected ? 'bg-brand text-white' : 'border border-line bg-white text-ink hover:bg-subtle'}
      `}
      aria-pressed={isSelected}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`rounded-full px-1.75 py-px font-mono text-2xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted'}`}>{count}</span>
      )}
    </button>
  )
}
