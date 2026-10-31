import type { ReactNode } from "react";
import type { ApiEstadoReporte } from "@/types/api-types";

// "Web/Etiqueta" del Figma: píldora con tono y, opcionalmente, un punto del mismo color.
const tones = {
    neutral: "bg-canvas text-ink-secondary",
    info: "bg-brand-subtle text-brand-text",
    success: "bg-success-subtle text-success",
    warning: "bg-warning-subtle text-warning",
    danger: "bg-danger-subtle text-danger",
} as const satisfies Record<string, string>;

export type BadgeTone = keyof typeof tones;

interface BadgeProps {
    children: ReactNode
    tone?: BadgeTone
    dot?: boolean
}

export function Badge({ children, tone = "neutral", dot = false }: BadgeProps) {
    return (
        <span className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.25 text-xs font-semibold ${tones[tone]}`}>
            {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
            {children}
        </span>
    );
}

// Tono de cada estado del reporte; los que no están aquí van en neutro.
const statusTones: Partial<Record<ApiEstadoReporte, BadgeTone>> = {
    Pendiente: "warning",
    Verificado: "success",
    Resuelto: "success",
};

/** Estado del reporte con el tono del Figma (Pendiente en ámbar, Verificado y Resuelto en verde). */
export function StatusBadge({ estado }: { estado: ApiEstadoReporte }) {
    return <Badge tone={statusTones[estado] ?? "neutral"} dot>{estado}</Badge>;
}
