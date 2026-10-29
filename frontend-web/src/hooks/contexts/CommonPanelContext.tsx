import { useState, type ReactNode } from "react";
import { validateChildren } from "../../components/CommonPanelAndModal/PanelAndModalComponents/view-components/validateChildren";
import PanelChrome from "../../panels/PanelChrome";
import {
    backPanel as navigateBack,
    closePanel as resetPanel,
    createPanelRouterState,
    hasPreviousPanel,
    openPanel as navigateToPanel,
} from "../../panels/panelRouter";
import { CommonPanelContext } from "./CommonPanelContext.ts";
import type { OpenPanel, PanelEntry } from "../../panels/panelTypes";

export function CommonPanelProvider({ children }: { children: ReactNode }) {
    validateChildren(children, "CommonPanelProvider");

    const [routerState, setRouterState] = useState(createPanelRouterState);

    // El Provider adapta la API pública al router puro; las decisiones de historial viven en panelRouter.
    const openPanel: OpenPanel = (view, ...args) => {
        const [props, options] = args;
        const entry = { view, props: props ?? {} } as PanelEntry;
        setRouterState((state) => navigateToPanel(state, entry, options));
    };

    const backView = () => setRouterState((state) => navigateBack(state));
    const closePanel = () => setRouterState((state) => resetPanel(state));

    return (
        <CommonPanelContext.Provider
            value={{
                currentPanelView: routerState.current?.view ?? null,
                openPanel,
                backView,
                hasPrevView: hasPreviousPanel(routerState),
                closePanel,
            }}
        >
            {children}
            {routerState.current && <PanelChrome entry={routerState.current} />}
        </CommonPanelContext.Provider>
    );
}
