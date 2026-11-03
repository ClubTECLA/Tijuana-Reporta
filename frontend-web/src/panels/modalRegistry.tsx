import UserMenu from "@/features/perfil/views/UserMenu";
import NotificationsMenu from "@/features/notificaciones/views/NotificationsMenu";

// Se guardan componentes para que ModalChrome los monte con las props de cada apertura.
export const modalRegistry = {
    "Menu de Usuario": UserMenu,
    "Menu de Notificaciones": NotificationsMenu,
} as const;
