import type { ComponentType } from "react";
import UserProfileView from "@/features/perfil/views/UserProfileView";
import HelpAndGuidesView from "@/features/ayuda/views/HelpAndGuidesView";
import NotificationsView from "@/features/notificaciones/views/NotificationsView";
import SettingView from "@/features/ajustes/views/SettingsView";
import NewIncidentView from "@/features/reportes/views/NewIncidentView";
import IncidentsView from "@/features/reportes/views/IncidentsView";
import IncidentDetailView from "@/features/reportes/views/IncidentDetailView";
import SummaryView from "@/features/resumen/views/SummaryView";
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
    "Resumen": SummaryView,
    "Nuevo Incidente": NewIncidentView,
    "Incidentes": IncidentsView,
    "Detalle Incidente": IncidentDetailView,
} satisfies PanelRegistry;
