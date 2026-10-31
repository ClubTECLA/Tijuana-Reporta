import { createContext } from "react";
import type { OpenPanel, PanelViewKey } from "./panelTypes";

// El contexto solo declara el contrato; el Provider de .tsx conecta ese contrato con React y el chrome.
export interface CommonPanelContextType {
    currentPanelView: PanelViewKey | null;
    openPanel: OpenPanel;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

export const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);
