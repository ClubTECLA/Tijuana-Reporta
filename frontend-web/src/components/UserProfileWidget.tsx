import { useState } from "react";
import type { componentProps } from "../types/db-types";
import { FaRegUser} from "react-icons/fa"

export default function UserProfileWidget({className, onClick} : componentProps) {
    const [ open, setopen ] = useState(false);

    return(
        <button
            type="button"
            className={`relative flex h-12 max-w-50 shrink-0 items-center justify-center ${className ?? ''}`}
            onClick={onClick}
            onMouseEnter={() => setopen(true)}
            onMouseLeave={() => setopen(false)}
        >
            <div className="flex flex-row items-center gap-2 h-13 rounded-full pl-2 pr-1 py-1 bg-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 p-3">
                    <FaRegUser className="text-2xl text-white" />
                </div>  

                <div 
                    className={`flex h-12 shrink-0 overflow-hidden whitespace-nowrap transition-[width,opacity,transform,padding] duration-700 ease-out ${
                        open
                        ? "w-36 scale-100 pr-2 opacity-100"
                        : "pointer-events-none w-0 scale-95 pr-0 opacity-0"
                    }`}
                >
                    <div className="flex flex-col h-12 justify-center items-start py-1">
                        <span className="truncate text-md font-bold text-gray-700 ">Nombre Apellido</span>
                        <span className="truncate text-sm font-semibold text-gray-600">Rol</span>
                    </div>
                </div>
            </div>
        </button>
    )
}