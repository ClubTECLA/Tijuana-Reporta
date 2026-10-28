import type { OpenPanelOptions, PanelEntry, PanelRouterState } from "./panelTypes";

/** Estado inicial del router, sin vista actual ni historial. */
export function createPanelRouterState(): PanelRouterState {
    return { current: null, history: [] };
}

// La identidad incluye props: abrir el detalle de dos reportes distintos crea entradas distintas.
function entryKey({ view, props }: PanelEntry): string {
    return `${view}:${JSON.stringify(props)}`;
}

export function openPanel(
    state: PanelRouterState,
    next: PanelEntry,
    options: OpenPanelOptions = {},
): PanelRouterState {
    // Evita duplicar la vista actual cuando se vuelve a solicitar la misma ruta y los mismos datos.
    if (state.current && entryKey(state.current) === entryKey(next)) return state;

    if (options.replace) {
        // El destino no debe quedar también en el historial; "atrás" no debe regresar a él.
        return {
            current: next,
            history: state.history.filter((item) => entryKey(item) !== entryKey(next)),
        };
    }

    const current = state.current;
    if (!current) return { current: next, history: state.history };

    return {
        current: next,
        history: [
            ...state.history.filter((item) => entryKey(item) !== entryKey(current)),
            current,
        ],
    };
}

export function backPanel(state: PanelRouterState): PanelRouterState {
    const previous = state.history.at(-1);
    if (!previous) return state;

    return {
        current: previous,
        history: state.history.slice(0, -1),
    };
}

/** Cerrar limpia la vista y todo el historial, sin mutar el estado recibido. */
export function closePanel(_state: PanelRouterState): PanelRouterState {
    if (_state.current === null && _state.history.length === 0) return _state;
    return createPanelRouterState();
}

export function hasPreviousPanel(state: PanelRouterState): boolean {
    return state.history.length > 0;
}
