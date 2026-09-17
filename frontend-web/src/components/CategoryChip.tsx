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
      className={`category-chip${isSelected ? ' category-chip-selected' : ''}`}
      aria-pressed={isSelected}
    >
      <span>{label}</span>
      {count !== undefined && <span className="category-chip-count">{count}</span>}
    </button>
  )
}
