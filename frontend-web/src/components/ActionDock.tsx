import { LuPlus } from "react-icons/lu";
import { useAuth } from "../hooks/contexts/AuthContext";
import { useCommonPanel } from "../hooks/useCommonPanel";
import Button from "./CommonPanelAndModal/PanelAndModalComponents/view-components/Button";

// "Dock de acciones" del Figma: acciones principales sobre el mapa.
// El analista tiene la vista de solo lectura en el Figma, por eso no ve el botón.
export default function ActionDock() {
    const { isAuthenticated, user } = useAuth();
    const { setPanelView } = useCommonPanel();

    if (!isAuthenticated || user?.rol_name === 'analista') return null;

    return (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <Button
                variant="report"
                size="lg"
                icon={<LuPlus />}
                title="Nuevo incidente"
                onClick={() => setPanelView("Nuevo Incidente")}
            />
        </div>
    );
}
