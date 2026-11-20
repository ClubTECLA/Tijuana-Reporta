import { useState, type ReactNode } from "react";
import { ModalsContext, type ModalEntry, type ModalsContextType, type Position } from "./ModalsContext.ts";

function isModalOptions(value: unknown): value is { fullFocus?: boolean } {
    return (
        typeof value === "object"
        && value !== null
        && "fullFocus" in value
        && typeof value.fullFocus === "boolean"
    );
}

export function ModalsProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalEntry | null>(null);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

    const resetPosition = () => setPosition({ x: 0, y: 0 });

    const openModal: ModalsContextType["openModal"] = (view, ...args) => {
        // Cada apertura comienza en la posición base, incluso si se cambia de un modal a otro.
        resetPosition();
        const hasOptions = args.length > 1 && isModalOptions(args[args.length - 1]);
        const options = hasOptions ? args.pop() : undefined;
        const [props] = args;
        setModal({
            view,
            props: props ?? {},
            fullFocus: isModalOptions(options) ? options.fullFocus ?? false : false,
        } as ModalEntry);
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
