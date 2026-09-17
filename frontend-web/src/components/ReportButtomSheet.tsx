import { useState } from 'react'
import { BottomSheet } from './BottomSheet'

interface ReportBottomSheetProps {
  isVisible: boolean
  onClose: () => void
}

const CATEGORIES = [
  { id: 'inundacion', label: 'Inundación' },
  { id: 'deslave', label: 'Deslave' },
  { id: 'arbol', label: 'Árbol/Poste' },
  { id: 'socavon', label: 'Socavón' },
  { id: 'luz', label: 'Falta de Luz' },
  { id: 'drenaje', label: 'Drenaje' },
]

export default function ReportBottomSheetTesting ({ isVisible, onClose }: ReportBottomSheetProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <div className="report-sheet-header">
        <h2>¿Qué ves?</h2>
        <button type="button" className="report-sheet-close" onClick={onClose} aria-label="Close">
          X
        </button>
      </div>

      <div className="report-category-grid">
        {CATEGORIES.map((category) => {
          const isSelected = selected === category.id

          return (
            <button
              type="button"
              key={category.id}
              className={`report-category${isSelected ? ' report-category-selected' : ''}`}
              onClick={() => setSelected(category.id)}
              aria-pressed={isSelected}
            >
              <span className="report-category-circle" />
              <span>{category.label}</span>
              {isSelected && <span className="report-category-check">✓</span>}
            </button>
          )
        })}
      </div>

      <ReportLocation />
    </BottomSheet>
  )
}

// Assuming the "Default" version might be a vertical list instead of a horizontal grid
export const ReportBottomSheetDefault = ({ isVisible, onClose }: ReportBottomSheetProps) => {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose}>
      <div className="report-sheet-header">
        <h2>¿Qué ves?</h2>
        <button type="button" className="report-sheet-close" onClick={onClose} aria-label="Close">
          X
        </button>
      </div>

      <div className="report-category-list">
        {CATEGORIES.map((category) => {
          const isSelected = selected === category.id

          return (
            <button
              type="button"
              key={category.id}
              className={`report-category-list-item${isSelected ? ' report-category-list-item-selected' : ''}`}
              onClick={() => setSelected(category.id)}
              aria-pressed={isSelected}
            >
              <span className="report-category-list-label">
                <span className="report-category-circle report-category-circle-small" />
                <span>{category.label}</span>
              </span>
              {isSelected && <span className="report-category-check">✓</span>}
            </button>
          )
        })}
      </div>

      <ReportLocation />
    </BottomSheet>
  )
}

const ReportLocation = () => (
  <div className="report-location">
    <span className="report-location-title">Ubicación del Reporte</span>
    <span className="report-location-text">Blvd. Uabc 224</span>
  </div>
)
