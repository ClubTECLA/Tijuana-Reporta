import { useEffect, useState } from "react";
import { useCommonPanel } from "./useCommonPanel";

/**
 * Borde derecho del panel común en px, o 0 sin panel abierto: lo usan los controles que se colocan en el mapa libre.
 * El ancho del panel cambia con la vista y con la ventana (25vw): se sigue con un ResizeObserver.
 */
export function usePanelRight() {
    const { currentPanel } = useCommonPanel();
    const [panelRight, setPanelRight] = useState(0);

    useEffect(() => {
        const panel = document.querySelector("[data-common-panel]");
        if (!panel) return;
        const observer = new ResizeObserver(() => setPanelRight(panel.getBoundingClientRect().right));
        observer.observe(panel);
        return () => observer.disconnect();
    }, [currentPanel]);

    return currentPanel ? panelRight : 0;
}
