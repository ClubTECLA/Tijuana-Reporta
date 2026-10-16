import type { ReactNode } from "react";
import UserProfileView from "../components/CommonPanelAndModal/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanelAndModal/PanelViews/HelpAndGuidesView";
import NotificationsView from "../components/CommonPanelAndModal/PanelViews/NotificationsView";
import SettingView from "../components/CommonPanelAndModal/PanelViews/SettingsView";
import NewIncidentView from "../components/CommonPanelAndModal/PanelViews/NewIncidentView";
import IncidentsView from "../components/CommonPanelAndModal/PanelViews/IncidentsView";

export const panelViews = {
    "Mi perfil": <UserProfileView />,
    "Ayudas y guias": <HelpAndGuidesView/>,
    "Notificaciones": <NotificationsView/>,
    "Ajustes": <SettingView/>,
    "Nuevo Incidente": <NewIncidentView/>,
    "Incidentes": <IncidentsView/>,
} as const satisfies Record<string, ReactNode>;

export type PanelViewKey = keyof typeof panelViews;