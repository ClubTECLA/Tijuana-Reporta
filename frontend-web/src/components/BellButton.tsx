import { LuBell } from 'react-icons/lu'
import { type componentProps } from "../types/db-types"

export default function BellButton({className, onClick}: componentProps) {
    return(
        <section 
            className={className}
            onClick={onClick}
        >
            <div className="absolute relative w-full h-full">
                <div 
                    className="absolute top-0 left-5 
                        flex items-center justify-center 
                        bg-red-500 rounded-full px-1 border-2 
                        border-white">
                    <span className="text-xs text-white font-bold">{100}</span>
                </div>
            </div>
            <div
                className="bg-white rounded-full p-3 shadow-lg shadow-gray-600"
            >

                <LuBell className="text-gray-600 text-xl"/>
            </div>
        </section>
    )
}