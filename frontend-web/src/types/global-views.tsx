import type { ReactNode } from "react";
import UserProfileView from "../components/CommonPanel/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanel/PanelViews/HelpAndGuidesView";
import NotificationsView from "../components/CommonPanel/PanelViews/NotificationsView";

export const panelViews = {
    "Mi perfil": <UserProfileView />,
    "Ayudas y guias": <HelpAndGuidesView/>,
    "Notificaciones": <NotificationsView/>
} as const satisfies Record<string, ReactNode>;

export type PanelViewKey = keyof typeof panelViews;