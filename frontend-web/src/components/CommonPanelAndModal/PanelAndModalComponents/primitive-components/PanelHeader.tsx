import type { ReactNode } from "react";
import { LuChevronLeft, LuX } from "react-icons/lu";
import { useCommonPanel } from "../../../../hooks/useCommonPanel";

interface PanelHeaderProps {
    title: string
    subtitle?: ReactNode
    /** Acciones a la derecha del título (p. ej. el botón "Nuevo"). */
    actions?: ReactNode
}

const headerButtonStyle = "flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-icon transition-colors hover:bg-line-soft";

// Cabecera de panel del Figma: regresar (si hay historial), cerrar, título, subtítulo y acciones.
// La usan ColSection y RowSection cuando reciben `title`.
export default function PanelHeader({ title, subtitle, actions }: PanelHeaderProps) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();

    return (
        <div className="flex w-full items-center gap-3 font-['Inter',sans-serif]">
            {hasPrevView &&
                <button type="button" aria-label="Regresar" onClick={backView} className={headerButtonStyle}>
                    <LuChevronLeft className="size-5" />
                </button>
            }
            <button type="button" aria-label="Cerrar" onClick={closePanel} className={headerButtonStyle}>
                <LuX className="size-5" />
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h2 className="text-[22px] font-bold text-ink">{title}</h2>
                {!!subtitle && <span className="text-[13px] text-ink-muted">{subtitle}</span>}
            </div>
            {actions}
        </div>
    );
}
