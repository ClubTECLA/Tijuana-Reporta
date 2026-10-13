import { createContext, useContext, useState, type ReactNode } from "react";
import { panelViews, type PanelViewKey } from "../../types/global-views";
import { validateChildren } from "../../components/CommonPanelAndModal/PanelAndModalComponents/view-components/validateChildren";

interface CommonPanelContextType {
    setPanelView: (newView: PanelViewKey | null) => void;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);

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

    const setPanelView = (view: PanelViewKey | null) => {
        setOpen(true);
        
        if(view === currentPanelView) return;
        if (!view) {
            setCurrentPanelView(null);
            return;
        }

        if (!(view in panelViews)) return;
        

        if (currentPanelView) {
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
                        shadow-lg shadow-gray-600 p-3
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

export const useCommonPanel = () => {
    const context = useContext(CommonPanelContext);

    if (context === undefined) {
        throw new Error("useCommonPanel must be used within a CommonPanelProvider");
    }

    return context;
};