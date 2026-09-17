interface CategoryChipProps {
  label: string
  count?: number
  isSelected?: boolean
  onPress?: () => void
}

export default function CategoryChip ({ label, count, isSelected = false, onPress }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`inline-flex items-center gap-2 rounded-full border-0 px-4 py-2 ${isSelected ? 'bg-[#2f80ed] text-white' : 'bg-[#f1f3f5] text-[#252a31]'}`}
      aria-pressed={isSelected}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-white px-1.5 py-0.5 text-xs text-[#2f80ed]">{count}</span>
      )}
    </button>
  )
}
