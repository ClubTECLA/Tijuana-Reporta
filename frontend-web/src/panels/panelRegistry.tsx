import type { ComponentType } from "react";
import UserProfileView from "../components/CommonPanelAndModal/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanelAndModal/PanelViews/HelpAndGuidesView";
import NotificationsView from "../components/CommonPanelAndModal/PanelViews/NotificationsView";
import SettingView from "../components/CommonPanelAndModal/PanelViews/SettingsView";
import NewIncidentView from "../components/CommonPanelAndModal/PanelViews/NewIncidentView";
import IncidentsView from "../components/CommonPanelAndModal/PanelViews/IncidentsView";
import IncidentDetailView from "../components/CommonPanelAndModal/PanelViews/IncidentDetailView";
import type { PanelViewKey, PanelViewPropsMap } from "./panelTypes";

// Punto de composición visual: los tipos y el router no importan este registro.
type PanelRegistry = {
    [K in PanelViewKey]: ComponentType<PanelViewPropsMap[K]>;
};

export const panelRegistry = {
    "Mi perfil": UserProfileView,
    "Ayudas y guias": HelpAndGuidesView,
    "Notificaciones": NotificationsView,
    "Ajustes": SettingView,
    "Nuevo Incidente": NewIncidentView,
    "Incidentes": IncidentsView,
    "Detalle Incidente": IncidentDetailView,
} satisfies PanelRegistry;
