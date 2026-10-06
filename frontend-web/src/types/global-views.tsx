import type { ReactNode } from "react";
import UserProfileView from "../components/CommonPanel/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanel/PanelViews/HelpAndGuidesView";
import NotificationsView from "../components/CommonPanel/PanelViews/NotificationsView";
import SettingView from "../components/CommonPanel/PanelViews/SettingsView";

export const panelViews = {
    "Mi perfil": <UserProfileView />,
    "Ayudas y guias": <HelpAndGuidesView/>,
    "Notificaciones": <NotificationsView/>,
    "Ajustes": <SettingView/>
} as const satisfies Record<string, ReactNode>;

export type PanelViewKey = keyof typeof panelViews;