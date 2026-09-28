import type { ReactNode } from "react";
import UserProfileView from "../components/CommonPanel/PanelViews/UserProfileView";

export const panelViews = {
    "Mi perfil": <UserProfileView />,
} as const satisfies Record<string, ReactNode>;

export type PanelViewKey = keyof typeof panelViews;