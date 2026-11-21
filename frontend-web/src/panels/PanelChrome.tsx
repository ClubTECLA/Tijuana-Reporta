import { createElement } from "react";
import { panelRegistry } from "./panelRegistry";
import type { PanelEntry } from "./panelTypes";

// El registro tiene componentes sin props y vistas con props requeridas (los detalles); el discriminante las estrecha.
function renderPanel(entry: PanelEntry, key: string) {
    if (entry.view === "Detalle Incidente") {
        return createElement(panelRegistry[entry.view], { ...entry.props, key });
    }
    if (entry.view === "Detalle Centro") {
        return createElement(panelRegistry[entry.view], { ...entry.props, key });
    }

    return createElement(panelRegistry[entry.view], { key });
}

export default function PanelChrome({ entry }: { entry: PanelEntry }) {
    // Cambiar de reporte desmonta el detalle anterior en lugar de reutilizar su estado local.
    const key = `${entry.view}:${JSON.stringify(entry.props)}`;

    return (
        // data-common-panel: el mapa lo mide para centrar el incidente abierto en el espacio libre a su derecha.
        // Por debajo de 1024 px empieza debajo de la cabecera, que ahí ocupa dos filas (buscador y secciones). Sin min-w-fit, que
        // ganaba a max-w-3/4: un contenido ancho (la tabla de Ajustes) hace scroll dentro en vez de salirse de la pantalla.
        <section
            data-common-panel
            className="
                fixed left-2 right-2 top-34 bottom-2
                min-w-0 max-w-none
                bg-glass backdrop-blur-glass rounded-3xl
                shadow-float p-3
                z-50
                sm:left-3 sm:right-auto sm:bottom-5 lg:top-20
                sm:w-fit sm:max-w-3/4 sm:p-4
            "
        >
            {renderPanel(entry, key)}
        </section>
    );
}
