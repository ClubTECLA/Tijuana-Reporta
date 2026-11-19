import { Badge } from "@/features/reportes/components/Badge";
import type { ApiNivelRiesgo } from "@/types/api-types";
import { formatScore, NIVEL_COLORS, NIVEL_TONES } from "../riesgo";

interface RiesgoRowProps {
    posicion: number
    nombre: string
    score: number
    nivel: ApiNivelRiesgo
    /** Texto para lectores de pantalla además del nombre (p. ej. cuántos reportes). */
    detalle: string
    /** Si se indica, la fila es un botón (las zonas centran el mapa). */
    onClick?: () => void
}

// Fila de "Zonas con mayor riesgo" y "Colonias con más incidentes" del Figma: posición, nombre, barra del índice,
// índice y nivel.
export default function RiesgoRow({ posicion, nombre, score, nivel, detalle, onClick }: RiesgoRowProps) {
    const content = <>
        <span className="w-4 shrink-0 text-xs text-ink-muted">{posicion}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{nombre}</span>
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-canvas" aria-hidden>
            <span className="block h-full rounded-full" style={{ width: `${Math.round(score * 100)}%`, backgroundColor: NIVEL_COLORS[nivel] }} />
        </span>
        <span className="w-9 shrink-0 text-right font-mono text-xs font-semibold text-ink">{formatScore(score)}</span>
        <span className="flex w-16 shrink-0 justify-end"><Badge tone={NIVEL_TONES[nivel]}>{nivel}</Badge></span>
        <span className="sr-only">{detalle}</span>
    </>;
    const style = "flex w-full items-center gap-2.5 px-3 py-2.5 text-left";

    return onClick
        ? <button type="button" onClick={onClick} className={`${style} transition-colors hover:bg-subtle`}>{content}</button>
        : <div className={style}>{content}</div>;
}
