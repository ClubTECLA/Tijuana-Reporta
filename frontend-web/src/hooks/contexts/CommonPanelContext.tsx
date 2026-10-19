import { createContext, createElement, useState, type ComponentType, type ReactNode } from "react";
import { panelViews, type PanelViewKey, type PanelViewProps } from "../../types/global-views";
import { validateChildren } from "../../components/CommonPanelAndModal/PanelAndModalComponents/view-components/validateChildren";

/** Opciones al abrir un panel. `props` es obligatorio si el panel necesita datos (p. ej. `{ reporteId }`). */
export type PanelViewOptions<K extends PanelViewKey> = { replace?: boolean } & (
    Partial<PanelViewProps<K>> extends PanelViewProps<K>
        ? { props?: PanelViewProps<K> }
        : { props: PanelViewProps<K> }
);

// Un panel sin datos admite llamarse sin opciones; uno con datos exige pasarlas.
type SetPanelViewArgs<K extends PanelViewKey> = Partial<PanelViewProps<K>> extends PanelViewProps<K>
    ? [options?: PanelViewOptions<K>]
    : [options: PanelViewOptions<K>];

type PanelEntry = { view: PanelViewKey; props: object };

// Identifica una entrada por panel y datos: el detalle del incidente A y el del B son entradas distintas.
const entryKey = ({ view, props }: PanelEntry) => `${view}:${JSON.stringify(props)}`;

interface CommonPanelContextType {
    /** Panel abierto en este momento (null si no hay ninguno), p. ej. para marcar su sección en la NavBar. */
    currentPanelView: PanelViewKey | null;
    /**
     * Abre un panel. Con `props` le pasa sus datos; con `replace`, sustituye al actual sin apilarlo
     * en el historial (p. ej. volver a la lista tras publicar).
     */
    setPanelView: <K extends PanelViewKey>(view: K | null, ...args: SetPanelViewArgs<K>) => void;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

export const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);

export function CommonPanelProvider({ children }: { children: ReactNode }) {
    validateChildren(children, "CommonPanelProvider");

    const [current, setCurrent] = useState<PanelEntry | null>(null);
    const [previousView, setPreviousView] = useState<PanelEntry[]>([]);
    const [ open, setOpen ] = useState(true);

    const closePanel = () => {
        setOpen(false);
        setCurrent(null);
        setPreviousView([]);
    }

    const backView = () => {
        if (previousView.length === 0) return;

        const nextPrevious = [...previousView];
        const previous = nextPrevious.pop();

        if (!previous) return;

        setCurrent(previous);
        setPreviousView(nextPrevious);
    };

    const setPanelView: CommonPanelContextType["setPanelView"] = (view, ...[options]) => {
        setOpen(true);

        if (!view) {
            setCurrent(null);
            return;
        }

        if (!(view in panelViews)) return;

        const next: PanelEntry = { view, props: options?.props ?? {} };
        if (current && entryKey(current) === entryKey(next)) return;

        if (options?.replace) {
            // Sin apilar el panel actual; y si el destino ya estaba en el historial, se quita para no volver a él con "atrás".
            setPreviousView((prev) => prev.filter((item) => entryKey(item) !== entryKey(next)));
        } else if (current) {
            setPreviousView((prev) => [...prev.filter((item) => entryKey(item) !== entryKey(current)), current]);
        }

        setCurrent(next);
    };

    return (
        <CommonPanelContext.Provider
            value={{
                currentPanelView: open && current ? current.view : null,
                setPanelView,
                backView,
                hasPrevView: previousView.length !== 0,
                closePanel
            }}
        >
            {children}
            {current && open && (
                <section
                    className="
                        fixed left-2 right-2 top-20 bottom-2
                        min-w-0 max-w-none
                        bg-white/90 rounded-2xl
                        shadow-float p-3
                        z-50
                        sm:left-3 sm:right-auto sm:bottom-5
                        sm:w-fit sm:max-w-3/4 sm:min-w-1/4 sm:p-4
                    "
                >
                    {/* key: al pasar del detalle A al B el panel se monta de nuevo y no arrastra el estado del anterior. */}
                    {createElement(panelViews[current.view] as ComponentType<object>, { key: entryKey(current), ...current.props })}
                </section>
            )}
        </CommonPanelContext.Provider>
    );
}
