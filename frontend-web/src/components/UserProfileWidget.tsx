import { useState } from "react";
import type { componentProps } from "../types/db-types";
import { useAuth } from "../hooks/contexts/AuthContext";
import { MdLogin } from "react-icons/md";
import { Link } from "react-router-dom";

export default function UserProfileWidget({className, onClick} : componentProps) {
    const { isAuthenticated, user } = useAuth();

    const [ open, setOpen ] = useState(false);

    return(
        <Link
            to={!isAuthenticated ? '/auth' : '/me'}    
            className={`
                relative flex h-12 max-w-50 shrink-0 
                flex-row items-center justify-center 
                gap-2 rounded-full bg-white pl-1
                py-1 shadow-lg shadow-gray-600
                ${className ?? ''}
            `}
            onClick={onClick}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-center">
                {!isAuthenticated ? <MdLogin className="text-2xl text-white font-bold"/> : <span className="text-xl text-center text-white font-bold">{user?.username.slice(0,2).toUpperCase()}</span>}
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
                        <span className="truncate w-full text-center text-md font-bold text-gray-700 ">Iniciar Sesion</span>
                        </>
                    :
                        <>
                        <span className="truncate text-md font-bold text-gray-700 ">{user?.username || "Usuario"}</span>
                        <span className="truncate text-sm font-semibold text-gray-600">{user?.rol_id || "Invitado"}</span>
                        </>
                    }
                </div>
            </div>
        </Link>
    )
}