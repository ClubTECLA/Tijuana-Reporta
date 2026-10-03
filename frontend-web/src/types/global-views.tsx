import type { ReactNode } from "react";
import UserProfileView from "../components/CommonPanel/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanel/PanelViews/HelpAndGuidesView";

export const panelViews = {
    "Mi perfil": <UserProfileView />,
    "Ayudas y guias": <HelpAndGuidesView/>
} as const satisfies Record<string, ReactNode>;

export type PanelViewKey = keyof typeof panelViews;