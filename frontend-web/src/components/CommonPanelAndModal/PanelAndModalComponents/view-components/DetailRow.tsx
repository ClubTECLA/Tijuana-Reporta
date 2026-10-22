import type { ReactNode } from "react";

interface DetailRowProps {
    icon: ReactNode
    label: string
    value: ReactNode
}

// Fila del bloque "Datos" del detalle (Figma): icono, etiqueta pequeña y valor. Se apilan dentro de una
// tarjeta con borde; el separador lo pone la tarjeta con divide-y.
export default function DetailRow({ icon, label, value }: DetailRowProps) {
    return (
        <div className="flex items-center gap-3 px-3.5 py-2.75">
            <span className="shrink-0 text-ink-muted [&>svg]:size-4.5" aria-hidden>{icon}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-xs text-ink-muted">{label}</span>
                <span className="text-sm font-medium text-ink">{value}</span>
            </div>
        </div>
    );
}
