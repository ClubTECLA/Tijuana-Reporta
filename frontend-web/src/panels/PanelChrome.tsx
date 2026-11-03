import { createElement } from "react";
import { panelRegistry } from "./panelRegistry";
import type { PanelEntry } from "./panelTypes";

// El registro tiene componentes sin props y una vista con props requeridas; el discriminante las estrecha.
function renderPanel(entry: PanelEntry, key: string) {
    if (entry.view === "Detalle Incidente") {
        return createElement(panelRegistry[entry.view], { ...entry.props, key });
    }

    return createElement(panelRegistry[entry.view], { key });
}

export default function PanelChrome({ entry }: { entry: PanelEntry }) {
    // Cambiar de reporte desmonta el detalle anterior en lugar de reutilizar su estado local.
    const key = `${entry.view}:${JSON.stringify(entry.props)}`;

    return (
        // data-common-panel: el mapa lo mide para centrar el incidente abierto en el espacio libre a su derecha.
        <section
            data-common-panel
            className="
                fixed left-2 right-2 top-20 bottom-2
                min-w-0 max-w-none
                bg-white/90 rounded-2xl
                shadow-float p-3
                z-50
                sm:left-3 sm:right-auto sm:bottom-5
                sm:w-fit sm:max-w-3/4 sm:min-w-fit sm:p-4
            "
        >
            {renderPanel(entry, key)}
        </section>
    );
}
