import type { ReactNode } from "react";
//modals imports
import UserMenu from "../components/modals/menus/UserMenu";

export const modals = {
    'Menu de Usuario' : <UserMenu/>
} as const satisfies Record<string, ReactNode>;

export type modalsKey = keyof typeof modals;