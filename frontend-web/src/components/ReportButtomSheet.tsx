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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-xl text-[#252a31]">¿Qué ves?</h2>
        <button type="button" className="border-0 bg-transparent px-2 py-1 text-[#68717d]" onClick={onClose} aria-label="Close">
          X
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto py-4">
        {CATEGORIES.map((category) => {
          const isSelected = selected === category.id

          return (
            <button
              type="button"
              key={category.id}
              className={`relative flex w-[100px] shrink-0 flex-col items-center gap-2 border-0 bg-transparent text-center ${isSelected ? 'font-bold text-[#252a31]' : 'text-[#68717d]'}`}
              onClick={() => setSelected(category.id)}
              aria-pressed={isSelected}
            >
              <span className={`block h-20 w-20 rounded-full ${isSelected ? 'bg-[#2f80ed]' : 'bg-[#f1f3f5]'}`} />
              <span>{category.label}</span>
              {isSelected && <span className="font-bold text-[#2f80ed]">✓</span>}
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-xl text-[#252a31]">¿Qué ves?</h2>
        <button type="button" className="border-0 bg-transparent px-2 py-1 text-[#68717d]" onClick={onClose} aria-label="Close">
          X
        </button>
      </div>

      <div className="grid">
        {CATEGORIES.map((category) => {
          const isSelected = selected === category.id

          return (
            <button
              type="button"
              key={category.id}
              className={`flex items-center justify-between border-0 border-b border-[#e2e6eb] px-2 py-4 text-left text-[#252a31] ${isSelected ? 'rounded-lg bg-[#f1f3f5]' : 'bg-transparent'}`}
              onClick={() => setSelected(category.id)}
              aria-pressed={isSelected}
            >
              <span className="flex items-center gap-4">
                <span className={`block h-10 w-10 rounded-full ${isSelected ? 'bg-[#2f80ed]' : 'bg-[#f1f3f5]'}`} />
                <span>{category.label}</span>
              </span>
              {isSelected && <span className="font-bold text-[#2f80ed]">✓</span>}
            </button>
          )
        })}
      </div>

      <ReportLocation />
    </BottomSheet>
  )
}

const ReportLocation = () => (
  <div className="mt-6 grid gap-1 rounded-lg bg-[#f1f3f5] p-4">
    <span className="text-xs text-[#68717d]">Ubicación del Reporte</span>
    <span className="text-base font-medium text-[#252a31]">Blvd. Uabc 224</span>
  </div>
)
