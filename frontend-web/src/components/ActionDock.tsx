import { LuPlus } from "react-icons/lu";
import { useAuth } from "../hooks/contexts/AuthContext";
import { useCommonPanel } from "../hooks/useCommonPanel";

// "Dock de acciones" del Figma: acciones principales sobre el mapa.
// El analista tiene la vista de solo lectura en el Figma, por eso no ve el botón.
export default function ActionDock() {
    const { isAuthenticated, user } = useAuth();
    const { setPanelView } = useCommonPanel();

    if (!isAuthenticated || user?.rol_name === 'analista') return null;

    return (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <button
                type="button"
                onClick={() => setPanelView("Nuevo Incidente")}
                className="
                    flex h-12 items-center justify-center gap-2.5 rounded-full
                    bg-report px-5.5 font-['Inter',sans-serif] text-base font-bold text-white
                    drop-shadow-button-report
                    transition duration-200 hover:brightness-90
                "
            >
                <LuPlus className="size-5" />
                Nuevo incidente
            </button>
        </div>
    );
}
