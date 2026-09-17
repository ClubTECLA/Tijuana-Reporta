import type { ReactNode } from 'react'

interface BottomSheetProps {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
}

export const BottomSheet = ({ isVisible, onClose, children }: BottomSheetProps) => {
  if (!isVisible) return null

  return (
    <div className="bottom-sheet-overlay" role="presentation">
      <button
        type="button"
        className="bottom-sheet-backdrop"
        aria-label="Close bottom sheet"
        onClick={onClose}
      />
      <section className="bottom-sheet" role="dialog" aria-modal="true">
        <div className="bottom-sheet-handle-container">
          <div className="bottom-sheet-handle" />
        </div>
        <div className="bottom-sheet-content">{children}</div>
      </section>
    </div>
  )
}
