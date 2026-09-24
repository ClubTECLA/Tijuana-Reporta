import { useState } from "react";
import type { componentProps } from "../types/db-types";
import { FaRegUser} from "react-icons/fa"

import { useAuth } from "../hooks/contexts/AuthContext";
import { MdLogin } from "react-icons/md";
import { Link } from "react-router-dom";

export default function UserProfileWidget({className, onClick} : componentProps) {
    const { isAuthenticated } = useAuth();

    const [ open, setOpen ] = useState(false);

    console.log(isAuthenticated);

    return(
        <button
            type="button"
            className={`
                relative flex h-12 max-w-50 
                shrink-0 items-center justify-center 
                shadow-lg shadow-gray-600 rounded-full ${className ?? ''}`}
            onClick={onClick}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            <Link 
                className="flex flex-row items-center gap-2 h-13 rounded-full pl-2 pr-1 py-1 bg-white"
                to={!isAuthenticated ? '/auth' : '/me'}    
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 ">
                    {!isAuthenticated ? <MdLogin className="text-2xl text-white font-bold"/> : <FaRegUser className="text-2xl text-white" />}
                </div>  

                <div 
                    className={`flex h-12 shrink-0 overflow-hidden whitespace-nowrap transition-[width,opacity,transform,padding] duration-700 ease-out ${
                        open
                        ? "w-36 scale-100 pr-2 opacity-100"
                        : "pointer-events-none w-0 scale-95 pr-0 opacity-0"
                    }`}
                >
                    <div className="flex flex-col h-12 justify-center items-start py-1">
                        {!isAuthenticated ? 
                            <>
                            <span className="truncate text-md font-bold text-gray-700 ">Iniciar Sesion</span>
                            </>
                        :
                            <>
                            <span className="truncate text-md font-bold text-gray-700 ">Nombre Apellido</span>
                            <span className="truncate text-sm font-semibold text-gray-600">Rol</span>
                            </>
                        }
                    </div>
                </div>
            </Link>
        </button>
    )
}