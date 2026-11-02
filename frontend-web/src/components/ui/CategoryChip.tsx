interface CategoryChipProps {
  label: string
  count?: number
  isSelected?: boolean
  onPress?: () => void
  /** Con color, "Web/Chip interactivo": punto de ese color y, seleccionado, fondo de ese color con el punto en blanco. */
  color?: string
}

// "Web/Chip de filtro" del Figma (tipo Píldora): blanco con borde, o azul de marca cuando está seleccionado.
export default function CategoryChip ({ label, count, isSelected = false, onPress, color }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={isSelected && color ? { backgroundColor: color } : undefined}
      className={`
        inline-flex items-center gap-2 rounded-full py-2.5 pl-3.5 pr-4
        text-sm font-semibold drop-shadow-card transition-colors duration-200
        ${isSelected ? 'bg-brand text-white' : 'border border-line bg-white text-ink hover:bg-subtle'}
      `}
      aria-pressed={isSelected}
    >
      {color && <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: isSelected ? 'white' : color }} />}
      <span>{label}</span>
      {count !== undefined && (
        <span className={`rounded-full px-1.75 py-px font-mono text-2xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-canvas text-ink-muted'}`}>{count}</span>
      )}
    </button>
  )
}
