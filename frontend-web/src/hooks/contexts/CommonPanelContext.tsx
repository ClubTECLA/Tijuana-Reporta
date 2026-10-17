import { createContext, useState, type ReactNode } from "react";
import { panelViews, type PanelViewKey } from "../../types/global-views";
import { validateChildren } from "../../components/CommonPanelAndModal/PanelAndModalComponents/view-components/validateChildren";

interface CommonPanelContextType {
    /** Panel abierto en este momento (null si no hay ninguno), p. ej. para marcar su sección en la NavBar. */
    currentPanelView: PanelViewKey | null;
    /** Con `replace`, el panel nuevo sustituye al actual sin apilarlo en el historial (p. ej. volver a la lista tras publicar). */
    setPanelView: (newView: PanelViewKey | null, options?: { replace?: boolean }) => void;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

export const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);

export function CommonPanelProvider({ children }: { children: ReactNode }) {
    validateChildren(children, "CommonPanelProvider");

    const [currentPanelView, setCurrentPanelView] = useState<PanelViewKey | null>(null);
    const [previousView, setPreviousView] = useState<PanelViewKey[]>([]);
    const [ open, setOpen ] = useState(true);

    const closePanel = () => {
        setOpen(false);
        setCurrentPanelView(null);
        setPreviousView([]);
    }

    const backView = () => {
        if (previousView.length === 0) return;

        const nextPrevious = [...previousView];
        const previous = nextPrevious.pop();

        if (!previous) return;

        setCurrentPanelView(previous);
        setPreviousView(nextPrevious);
    };

    const setPanelView = (view: PanelViewKey | null, options?: { replace?: boolean }) => {
        setOpen(true);

        if(view === currentPanelView) return;
        if (!view) {
            setCurrentPanelView(null);
            return;
        }

        if (!(view in panelViews)) return;


        if (options?.replace) {
            // Sin apilar el panel actual; y si el destino ya estaba en el historial, se quita para no volver a él con "atrás".
            setPreviousView((prev) => prev.filter((item) => item !== view));
        } else if (currentPanelView) {
            setPreviousView((prev) => {
                const nextPrev = prev.includes(currentPanelView)
                    ? prev.filter((item) => item !== currentPanelView)
                    : [...prev];

                return [...nextPrev, currentPanelView];
            });
        }

        setCurrentPanelView(view);
    };

    return (
        <CommonPanelContext.Provider
            value={{
                currentPanelView: open ? currentPanelView : null,
                setPanelView,
                backView,
                hasPrevView: previousView.length !== 0,
                closePanel
            }}
        >
            {children}
            {currentPanelView && open && (
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
                    {panelViews[currentPanelView]}
                </section>
            )}
        </CommonPanelContext.Provider>
    );
}