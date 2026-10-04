import type { ReactNode } from "react";
//modals imports
import UserMenu from "../components/modals/menus/UserMenu";
import NotificationsMenu from "../components/modals/menus/NotificationsMenu";

export const modals = {
    'Menu de Usuario' : <UserMenu/>,
    'Menu de Notificaciones': <NotificationsMenu/>
} as const satisfies Record<string, ReactNode>;

export type modalsKey = keyof typeof modals;