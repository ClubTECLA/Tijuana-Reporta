import type { ReactNode } from "react";
import { LuChevronLeft, LuX } from "react-icons/lu";
import { useCommonPanel } from "../../../../hooks/useCommonPanel";

interface DetailHeroProps {
    /** Color de fondo mientras no hay foto (p. ej. el de la categoría). */
    color: string
    /** Icono grande y tenue en el centro. */
    icon: ReactNode
    /** Píldoras de la esquina inferior (origen, número de fotos...). */
    children?: ReactNode
}

const heroButtonStyle = "flex size-10 items-center justify-center rounded-full bg-surface text-icon shadow-raised transition hover:brightness-95";

// Cabecera de los paneles de detalle del Figma ("Panel · Detalle de incidente", también en Refugio):
// foto de 200 px con regresar y cerrar encima.
// shortcut: el backend aún no sirve las fotos (multimedia solo trae un path); se usa el color e icono de la categoría.
export default function DetailHero({ color, icon, children }: DetailHeroProps) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();

    return (
        <div className="relative h-50 w-full shrink-0 overflow-hidden rounded-[20px]" style={{ backgroundColor: color }}>
            <span className="absolute inset-0 flex items-center justify-center text-white/25 [&>svg]:size-28" aria-hidden>{icon}</span>
            <span className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent via-40% to-black/25" aria-hidden />
            {hasPrevView &&
                <button type="button" aria-label="Regresar" onClick={backView} className={`absolute left-4 top-4 ${heroButtonStyle}`}>
                    <LuChevronLeft className="size-5" />
                </button>
            }
            <button type="button" aria-label="Cerrar" onClick={closePanel} className={`absolute right-4 top-4 ${heroButtonStyle}`}>
                <LuX className="size-5" />
            </button>
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2">
                {children}
            </div>
        </div>
    );
}
