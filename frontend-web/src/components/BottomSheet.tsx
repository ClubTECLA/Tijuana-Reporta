import type { ReactNode } from 'react'

interface BottomSheetProps {
  isVisible: boolean
  onClose: () => void
  children: ReactNode
}

export default function BottomSheet({ isVisible, onClose, children }: BottomSheetProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/40"
        aria-label="Close bottom sheet"
        onClick={onClose}
      />
      <section
        className="relative max-h-[85vh] min-h-[300px] w-full overflow-auto rounded-t-[24px] bg-white pb-8 shadow-[0_-2px_16px_rgb(0_0_0_/_10%)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-[#c5cbd3]" />
        </div>
        <div className="px-6">{children}</div>
      </section>
    </div>
  )
}
