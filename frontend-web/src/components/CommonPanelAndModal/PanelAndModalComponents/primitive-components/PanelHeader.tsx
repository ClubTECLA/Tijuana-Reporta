import type { ReactNode } from "react";
import PanelNavButton from "./PanelNavButton";

interface PanelHeaderProps {
    title: string
    subtitle?: ReactNode
    /** Acciones a la derecha del título (p. ej. el botón "Nuevo"). */
    actions?: ReactNode
}

const headerButtonStyle = "bg-subtle hover:bg-line-soft";

// Cabecera de panel del Figma: regresar (si hay historial), cerrar, título, subtítulo y acciones.
// La usan ColSection y RowSection cuando reciben `title`.
export default function PanelHeader({ title, subtitle, actions }: PanelHeaderProps) {
    return (
        <div className="flex w-full items-center gap-3 font-ui">
            <PanelNavButton kind="back" className={headerButtonStyle} />
            <PanelNavButton kind="close" className={headerButtonStyle} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h2 className="text-title font-bold text-ink">{title}</h2>
                {!!subtitle && <span className="text-caption text-ink-muted">{subtitle}</span>}
            </div>
            {actions}
        </div>
    );
}
