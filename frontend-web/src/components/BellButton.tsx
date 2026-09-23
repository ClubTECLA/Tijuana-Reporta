import { LuBell } from 'react-icons/lu'
import type { componentProps } from "../types/db-types"

export default function BellButton({className, onClick}: componentProps) {
    return(
        <button
            type="button"
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center ${className ?? ''}`}
            onClick={onClick}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-3 shadow-lg shadow-gray-600">
                <LuBell className="text-2xl text-gray-600" />
            </div>
            <div className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1">
                <span className="text-xs font-bold leading-none text-white">{100}</span>
            </div>
        </button>
    )
}