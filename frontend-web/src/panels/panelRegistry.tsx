import type { ComponentType } from "react";
import MapFiltersView from "@/features/mapa/views/MapFiltersView";
import UserProfileView from "@/features/perfil/views/UserProfileView";
import HelpAndGuidesView from "@/features/ayuda/views/HelpAndGuidesView";
import NotificationsView from "@/features/notificaciones/views/NotificationsView";
import SettingView from "@/features/ajustes/views/SettingsView";
import NewIncidentView from "@/features/reportes/views/NewIncidentView";
import IncidentsView from "@/features/reportes/views/IncidentsView";
import IncidentDetailView from "@/features/reportes/views/IncidentDetailView";
import SummaryView from "@/features/resumen/views/SummaryView";
import UsersView from "@/features/usuarios/views/UsersView";
import type { PanelViewKey, PanelViewPropsMap } from "./panelTypes";
import SearchView from "@/features/busqueda/views/SearchView";
import CentrosView from "@/features/centros/views/CentrosView";
import CentroDetailView from "@/features/centros/views/CentroDetailView";
import NewCentroView from "@/features/centros/views/NewCentroView";

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
    "Usuarios": UsersView,
    "Capas y filtros": MapFiltersView,
    "Busqueda": SearchView,
    "Centros": CentrosView,
    "Detalle Centro": CentroDetailView,
    "Nuevo Centro": NewCentroView,
} satisfies PanelRegistry;
