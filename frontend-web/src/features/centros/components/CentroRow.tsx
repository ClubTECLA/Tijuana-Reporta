import { LuChevronRight, LuUsers } from "react-icons/lu";
import type { ApiCentro, ApiTipoCentro } from "@/types/api-types";
import { Badge } from "@/features/reportes/components/Badge";
import { estaOcupado, lugaresDisponibles, lugaresTexto } from "@/features/centros/centroFormat";
import CentroIcon from "./CentroIcon";

interface CentroRowProps {
    centro: ApiCentro
    tipo?: ApiTipoCentro
    onClick: () => void
}

// "Web/Refugio" del Figma: icono del tipo, nombre, ubicación, estado (Disponible u Ocupado) y lugares libres.
// shortcut: se muestran las coordenadas porque el API no guarda la dirección y pedirla a Nominatim por cada fila
// supera su límite de 1 petición/s; mostrar la dirección cuando el backend la incluya en el centro.
export default function CentroRow({ centro, tipo, onClick }: CentroRowProps) {
    const lugares = lugaresDisponibles(centro);
    const ocupado = estaOcupado(centro);

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-[20px] bg-white py-3 pl-3 pr-3.5 text-left shadow-raised transition hover:bg-brand-subtle"
        >
            <CentroIcon tipo={tipo} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-body font-semibold text-ink">{centro.nombre}</span>
                <span className="truncate text-caption text-ink-muted">
                    {tipo?.nombre ?? "Centro"} · {centro.latitude.toFixed(4)}, {centro.longitude.toFixed(4)}
                </span>
                <span className="flex items-center gap-2">
                    <Badge tone={ocupado ? "danger" : "success"} dot>{ocupado ? "Ocupado" : "Disponible"}</Badge>
                    {lugares !== null &&
                        <span className="flex items-center gap-1 text-xs font-medium text-ink-secondary">
                            <LuUsers className="size-3.5" aria-hidden />
                            {lugaresTexto(lugares)}
                        </span>
                    }
                </span>
            </span>
            <LuChevronRight className="size-4.5 shrink-0 text-ink-muted" aria-hidden />
        </button>
    );
}
