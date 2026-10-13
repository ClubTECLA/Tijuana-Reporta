import { createContext, useState, type ReactNode } from "react";
import type { modalsKey } from "../../types/global-modals";

type ModalsContextType = {
    setModal: (key: modalsKey | null) => void;
    closeModal: () => void;
    currentModal: modalsKey | null;
};

export const ModalsContext = createContext<ModalsContextType | undefined>(undefined);

export function ModalsProvider({ children }: { children: ReactNode }) {
    const [ currentModal, setCurrentModal ] = useState<modalsKey | null>(null);

    return (
        <ModalsContext.Provider
            value={{
                setModal: setCurrentModal,
                closeModal: () => setCurrentModal(null),
                currentModal,
            }}
        >
            {children}
        </ModalsContext.Provider>
    );
}