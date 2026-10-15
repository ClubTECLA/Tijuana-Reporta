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
        text-sm font-semibold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.06)] transition-colors duration-200
        ${isSelected ? 'bg-[#2677e6] text-white' : 'border border-[#d9e0e8] bg-white text-[#111827] hover:bg-slate-50'}
      `}
      aria-pressed={isSelected}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`rounded-full px-1.75 py-px font-mono text-[11px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#e8edf3] text-[#64748b]'}`}>{count}</span>
      )}
    </button>
  )
}
