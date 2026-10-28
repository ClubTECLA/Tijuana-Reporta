import { useState } from "react";
import type { componentProps } from "../types/utils-types";
import { useAuth } from "../hooks/contexts/AuthContext";
import { LuLogIn } from "react-icons/lu";
import { Link } from "react-router-dom";
import { initials, rolLabel } from "../types/users";

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
                font-ui
                shadow-raised
                transition-[padding] duration-700 ease-out
                ${className ?? ''}
            `}
            onClick={() => {
                if(isAuthenticated)
                    onClick?.()
            }}

            to={!isAuthenticated ? '/auth?tab=login' : '#'}
            onMouseEnter={() => setOpen(true)}

        >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
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
                    <span className="text-caption font-semibold text-ink">Iniciar sesión</span>
                :
                    <>
                    <span className="max-w-48 truncate text-caption font-semibold text-ink">{user?.username || "Usuario"}</span>
                    <span className="max-w-48 truncate text-xs text-ink-muted">
                        {user?.rol_name ? rolLabel(user.rol_name) : "Invitado"}
                    </span>
                    </>
                }
            </div>
        </Link>
    )
}