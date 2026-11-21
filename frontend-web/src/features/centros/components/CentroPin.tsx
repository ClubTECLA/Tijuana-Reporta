import type { ApiCentro, ApiTipoCentro } from "@/types/api-types";
import { estaOcupado } from "@/features/centros/centroFormat";
import { tipoStyle } from "@/features/centros/tiposCentro";
import CentroIcon from "./CentroIcon";

interface CentroPinProps {
    centro: ApiCentro
    tipo?: ApiTipoCentro
    /** Su detalle está abierto en el panel: pin más grande con un halo de su color (pantalla 9 del Figma). */
    selected?: boolean
}

// Pin cuadrado de un centro en el mapa. Se pinta dentro del <button> del
// marcador (CentrosLayer), que abre el detalle.
export default function CentroPin({ centro, tipo, selected = false }: CentroPinProps) {
    const { color } = tipoStyle(tipo);
    const label = `${centro.nombre}, ${tipo?.nombre ?? "Centro"}, ${estaOcupado(centro) ? "ocupado" : "disponible"}`;

    return (
        <span title={label} data-selected={selected || undefined} className="relative flex items-center justify-center">
            <span className="sr-only">{label}. {selected ? "Abierto en el panel" : "Ver detalle"}</span>
            {selected &&
                // Sin eventos: el halo sobresale del botón y los clics a su alrededor deben llegar al mapa.
                <span
                    className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
                    aria-hidden
                />
            }
            <CentroIcon tipo={tipo} className={`shadow-pin transition-transform duration-300 ${selected ? "scale-125" : ""}`} />
        </span>
    );
}
