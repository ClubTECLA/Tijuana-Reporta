import type { ReactNode } from "react";
import PanelNavButton from "../primitive-components/PanelNavButton";

interface DetailHeroProps {
    /** Color de fondo mientras no hay foto (p. ej. el de la categoría). */
    color: string
    /** Icono grande y tenue en el centro, cuando no hay foto. */
    icon: ReactNode
    /** URL de la foto del reporte; sin ella se usan el color y el icono. */
    photo?: string
    /** Píldoras de la esquina inferior (origen, número de fotos...). */
    children?: ReactNode
}

const heroButtonStyle = "absolute top-4 bg-surface shadow-raised hover:brightness-95";

// Cabecera de los paneles de detalle del Figma ("Panel · Detalle de incidente", también en Refugio):
// foto de 200 px con regresar y cerrar encima.
export default function DetailHero({ color, icon, photo, children }: DetailHeroProps) {
    return (
        <div className="relative h-50 w-full shrink-0 overflow-hidden rounded-[20px]" style={{ backgroundColor: color }}>
            {photo
                ? <img src={photo} alt="Foto del incidente" className="absolute inset-0 size-full object-cover" />
                : <span className="absolute inset-0 flex items-center justify-center text-white/25 [&>svg]:size-28" aria-hidden>{icon}</span>}
            <span className="absolute inset-0 bg-linear-to-b from-black/35 via-transparent via-40% to-black/25" aria-hidden />
            <PanelNavButton kind="back" className={`left-4 ${heroButtonStyle}`} />
            <PanelNavButton kind="close" className={`right-4 ${heroButtonStyle}`} />
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2">
                {children}
            </div>
        </div>
    );
}
