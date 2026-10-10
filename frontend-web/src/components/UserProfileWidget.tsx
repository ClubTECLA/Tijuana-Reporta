import { useState } from "react";
import type { componentProps } from "../types/utils-types";
import { useAuth } from "../hooks/contexts/AuthContext";
import { LuLogIn } from "react-icons/lu";
import { Link } from "react-router-dom";

const rolLabels: Record<string, string> = {
    admin: "Administrador",
    moderador: "Moderador",
    analista: "Analista",
    proteccion_civil: "Protección Civil",
    rescatista: "Rescatista",
    ciudadano: "Ciudadano",
}

function initials(username: string) {
    const [first = "", second = ""] = username.trim().split(/\s+/)
    return (second ? first[0] + second[0] : first.slice(0, 2)).toUpperCase()
}

export default function UserProfileWidget({className, onClick} : componentProps) {
    const { isAuthenticated, user } = useAuth();

    const [ open, setOpen ] = useState(true);

    return(
        <Link
            className={`
                relative flex h-14 shrink-0
                flex-row items-center gap-2.5
                rounded-full border border-white bg-white
                py-1.5 pl-1.5 ${open ? 'pr-4.5' : 'pr-1.5'}
                font-['Inter',sans-serif]
                shadow-[0_1px_3px_rgba(0,0,0,0.15)]
                transition-[padding] duration-700 ease-out
                ${className ?? ''}
            `}
            onClick={() => {
                if(isAuthenticated)
                    onClick?.()
            }}

            to={!isAuthenticated ? '/auth' : '#'}
            onMouseEnter={() => setOpen(true)}

        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2677e6] text-white">
                {!isAuthenticated
                    ? <LuLogIn className="text-xl" />
                    : <span className="text-sm font-semibold">{initials(user?.username ?? "")}</span>
                }
            </div>

            <div
                className={`flex shrink-0 flex-col items-start overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-700 ease-out ${
                    open
                    ? "max-w-48 opacity-100"
                    : "pointer-events-none max-w-0 opacity-0"
                }`}
            >
                {!isAuthenticated ?
                    <span className="text-[13px] font-semibold text-[#111827]">Iniciar sesión</span>
                :
                    <>
                    <span className="max-w-48 truncate text-[13px] font-semibold text-[#111827]">{user?.username || "Usuario"}</span>
                    <span className="max-w-48 truncate text-xs text-[#64748b]">
                        {(user?.rol_name && rolLabels[user.rol_name]) || user?.rol_name || "Invitado"}
                    </span>
                    </>
                }
            </div>
        </Link>
    )
}