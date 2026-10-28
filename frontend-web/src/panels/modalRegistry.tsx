import UserMenu from "../components/menus/UserMenu";
import NotificationsMenu from "../components/menus/NotificationsMenu";

// Se guardan componentes para que ModalChrome los monte con las props de cada apertura.
export const modalRegistry = {
    "Menu de Usuario": UserMenu,
    "Menu de Notificaciones": NotificationsMenu,
} as const;
