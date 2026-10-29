import { useState, type ReactNode } from "react";
import { ModalsContext, type ModalEntry, type ModalsContextType, type Position } from "./CommonModalContext.ts";

export function ModalsProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalEntry | null>(null);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    const resetPosition = () => setPosition({ x: 0, y: 0 });

    const openModal: ModalsContextType["openModal"] = (view, ...args) => {
        // Cada apertura comienza en la posición base, incluso si se cambia de un modal a otro.
        resetPosition();
        const [props] = args;
        setModal({ view, props: props ?? {} } as ModalEntry);
    };

    const closeModal = () => {
        resetPosition();
        setModal(null);
    };

    return (
        <ModalsContext.Provider
            value={{
                openModal,
                closeModal,
                currentModal: modal?.view ?? null,
                position,
                setPosition,
                resetPosition,
                modal,
            }}
        >
            {children}
        </ModalsContext.Provider>
    );
}
