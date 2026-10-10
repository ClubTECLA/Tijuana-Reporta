import { LuBell } from 'react-icons/lu'

interface BellButtonProps {
    className?: string,
    onClick?: () => void
    cantNotis?: string | number;
}

export default function BellButton({className, onClick, cantNotis}: BellButtonProps) {
    return(
        <button
            type="button"
            className={`    
                relative flex h-12 w-12 
                shrink-0 items-center 
                justify-center ${className ?? ''}
                hover:scale-105 transition-all duration-300
            `}
            onClick={onClick}
            aria-label="Notificaciones"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
                <LuBell className="text-2xl text-gray-600" />
            </div>
            {Number(cantNotis) > 0 && 
                <div className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1">
                    <span className="text-xs font-bold leading-none text-white">{cantNotis}</span>
                </div>
            }
        </button>
    )
}