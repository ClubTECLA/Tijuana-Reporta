/**
 * Contrato entre las vistas del panel y el router.
 * Se mantiene libre de imports de React y de componentes para evitar ciclos de dependencias.
 */
export type PanelViewPropsMap = {
    "Mi perfil": object;
    "Ayudas y guias": object;
    "Notificaciones": object;
    "Ajustes": object;
    "Nuevo Incidente": object;
    "Incidentes": object;
    "Detalle Incidente": { reporteId: string };
};

export type PanelViewKey = keyof PanelViewPropsMap;

/** Props asociadas a una vista concreta, inferidas desde su nombre. */
export type PanelViewProps<K extends PanelViewKey> = PanelViewPropsMap[K];

/** Unión discriminada: cada vista solo puede llevar las props declaradas para ella. */
export type PanelEntry = {
    [K in PanelViewKey]: {
        view: K;
        props: PanelViewProps<K>;
    };
}[PanelViewKey];

export interface PanelRouterState {
    current: PanelEntry | null;
    history: PanelEntry[];
}

export interface OpenPanelOptions {
    /** Sustituye la vista actual y evita añadirla al historial. */
    replace?: boolean;
}

// Mantiene opcionales las props de las vistas sin datos y obligatorias las de vistas como el detalle.
type OpenPanelArgs<K extends PanelViewKey> = keyof PanelViewProps<K> extends never
    ? [props?: PanelViewProps<K>, options?: OpenPanelOptions]
    : [props: PanelViewProps<K>, options?: OpenPanelOptions];

export type OpenPanel = <K extends PanelViewKey>(view: K, ...args: OpenPanelArgs<K>) => void;
