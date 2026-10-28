import type { ComponentProps } from "react";
import type { modalRegistry } from "./modalRegistry";

// Los nombres y las props se derivan de componentes reales, no de elementos JSX preconstruidos.
export type ModalViewKey = keyof typeof modalRegistry;
export type ModalViewProps<K extends ModalViewKey> = ComponentProps<(typeof modalRegistry)[K]> extends object
    ? ComponentProps<(typeof modalRegistry)[K]>
    : Record<never, never>;

type OpenModalArgs<K extends ModalViewKey> = keyof ModalViewProps<K> extends never
    ? [props?: ModalViewProps<K>]
    : [props: ModalViewProps<K>];

export type OpenModal = <K extends ModalViewKey>(view: K, ...args: OpenModalArgs<K>) => void;
