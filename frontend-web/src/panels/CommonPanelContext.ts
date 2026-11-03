import { createContext } from "react";
import type { OpenPanel, PanelEntry, PanelViewKey } from "./panelTypes";

// El contexto solo declara el contrato; el Provider de .tsx conecta ese contrato con React y el chrome.
export interface CommonPanelContextType {
    currentPanelView: PanelViewKey | null;
    /** Vista actual con sus props, p. ej. el reporteId del detalle (el mapa resalta ese incidente). */
    currentPanel: PanelEntry | null;
    openPanel: OpenPanel;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

export const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);
