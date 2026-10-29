import { createContext, type Dispatch, type SetStateAction } from "react";
import type { ModalViewKey, ModalViewProps, OpenModal } from "../../panels/modalTypes";

export type Position = { x: number; y: number };
export type ModalEntry = { [K in ModalViewKey]: { view: K; props: ModalViewProps<K> } }[ModalViewKey];

// Separa la declaración del contexto del Provider y evita mezclar contratos con presentación.
export type ModalsContextType = {
    openModal: OpenModal;
    closeModal: () => void;
    currentModal: ModalViewKey | null;
    position: Position;
    setPosition: Dispatch<SetStateAction<Position>>;
    resetPosition: () => void;
    modal: ModalEntry | null;
};

export const ModalsContext = createContext<ModalsContextType | undefined>(undefined);
