import type { ReactNode } from "react";
//modals imports
import UserMenu from "../components/menus/UserMenu";
import NotificationsMenu from "../components/menus/NotificationsMenu";

export const modals = {
    'Menu de Usuario' : <UserMenu/>,
    'Menu de Notificaciones': <NotificationsMenu/>
} as const satisfies Record<string, ReactNode>;

export type modalsKey = keyof typeof modals;