import type { ReactNode } from "react";

// "Web/Acción de incidente" del Figma: icono en un cuadro redondeado de 44 px y su texto debajo.
const tones = {
    primary: "bg-accent text-white",
    default: "bg-subtle text-icon",
    danger: "bg-alert/14 text-alert",
} as const satisfies Record<string, string>;

interface IncidentActionProps {
    icon: ReactNode
    label: string
    tone?: keyof typeof tones
    onClick?: () => void
    disabled?: boolean
    /** Texto al pasar el ratón, p. ej. por qué está deshabilitada. */
    tooltip?: string
}

export default function IncidentAction({ icon, label, tone = "default", onClick, disabled = false, tooltip }: IncidentActionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className="group flex w-18 shrink-0 flex-col items-center gap-1.5 disabled:cursor-not-allowed"
        >
            <span className={`flex size-11 items-center justify-center rounded-2xl transition group-hover:brightness-95 group-disabled:opacity-50 group-disabled:group-hover:brightness-100 [&>svg]:size-5 ${tones[tone]}`}>
                {icon}
            </span>
            <span className="whitespace-nowrap font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold text-icon group-disabled:opacity-60">
                {label}
            </span>
        </button>
    );
}
