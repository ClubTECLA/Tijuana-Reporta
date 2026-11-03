import { LuChevronLeft, LuX } from "react-icons/lu";
import { useCommonPanel } from "@/panels/useCommonPanel";

interface PanelNavButtonProps {
    /** "back" solo se pinta si hay un panel anterior en el historial. */
    kind: "back" | "close"
    /** Colores y posición: cada cabecera (PanelHeader, DetailHero) les da su estilo del Figma. */
    className?: string
}

// Botones de regresar y cerrar del panel común, compartidos por PanelHeader y DetailHero.
export default function PanelNavButton({ kind, className = "" }: PanelNavButtonProps) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();
    if (kind === "back" && !hasPrevView) return null;

    const isBack = kind === "back";
    return (
        <button
            type="button"
            aria-label={isBack ? "Regresar" : "Cerrar"}
            onClick={isBack ? backView : closePanel}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-icon transition ${className}`}
        >
            {isBack ? <LuChevronLeft className="size-5" /> : <LuX className="size-5" />}
        </button>
    );
}
