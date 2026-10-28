import { LuPlus } from "react-icons/lu";
import { useAuth } from "../hooks/contexts/AuthContext";
import { useCommonPanel } from "../hooks/useCommonPanel";
import Button from "./CommonPanelAndModal/PanelAndModalComponents/view-components/Button";
import { canPublishIncidents } from "../types/users";

// "Dock de acciones" del Figma: acciones principales sobre el mapa.
// Sin el botón para quien no puede publicar: el analista (solo lectura) y el ciudadano (el backend le respondería 403).
export default function ActionDock() {
    const { isAuthenticated, user } = useAuth();
    const { setPanelView } = useCommonPanel();

    if (!isAuthenticated || !canPublishIncidents(user?.rol_name)) return null;

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
