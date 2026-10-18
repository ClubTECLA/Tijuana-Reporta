import type { ComponentProps, ComponentType } from "react";
import UserProfileView from "../components/CommonPanelAndModal/PanelViews/UserProfileView";
import HelpAndGuidesView from "../components/CommonPanelAndModal/PanelViews/HelpAndGuidesView";
import NotificationsView from "../components/CommonPanelAndModal/PanelViews/NotificationsView";
import SettingView from "../components/CommonPanelAndModal/PanelViews/SettingsView";
import NewIncidentView from "../components/CommonPanelAndModal/PanelViews/NewIncidentView";
import IncidentsView from "../components/CommonPanelAndModal/PanelViews/IncidentsView";
import IncidentDetailView from "../components/CommonPanelAndModal/PanelViews/IncidentDetailView";

// Registro de paneles: nombre → componente. Un panel que necesita datos (p. ej. qué incidente mostrar)
// los declara como props y se abren con setPanelView("Nombre", { props: { ... } }).
export const panelViews = {
    "Mi perfil": UserProfileView,
    "Ayudas y guias": HelpAndGuidesView,
    "Notificaciones": NotificationsView,
    "Ajustes": SettingView,
    "Nuevo Incidente": NewIncidentView,
    "Incidentes": IncidentsView,
    "Detalle Incidente": IncidentDetailView,
} as const satisfies Record<string, ComponentType<never>>;

export type PanelViewKey = keyof typeof panelViews;

/** Props que recibe el panel `K` (vacías para los paneles que no necesitan datos). */
export type PanelViewProps<K extends PanelViewKey> = ComponentProps<(typeof panelViews)[K]>;
