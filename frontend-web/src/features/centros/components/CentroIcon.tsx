import { LuBuilding2 } from "react-icons/lu";
import type { ApiTipoCentro } from "@/types/api-types";
import { tipoStyle } from "@/features/centros/tiposCentro";

interface CentroIconProps {
    tipo?: ApiTipoCentro
    className?: string
}

// Icono cuadrado de un centro (fila de la lista, pin del mapa y detalle del Figma): color de su tipo, borde un tono
// más oscuro e icono blanco. Los cuadrados distinguen los centros de los incidentes, que son redondos.
export default function CentroIcon({ tipo, className = "" }: CentroIconProps) {
    const { color, icon } = tipoStyle(tipo);
    return (
        <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-[11px] border-2 text-white ${className}`}
            style={{ backgroundColor: color, borderColor: `color-mix(in srgb, ${color} 85%, black)` }}
            aria-hidden
        >
            {icon ? <img src={icon} alt="" className="size-6.5 object-contain" /> : <LuBuilding2 className="size-5.5" />}
        </span>
    );
}
