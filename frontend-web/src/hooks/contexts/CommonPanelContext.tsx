import { createContext, useContext, useState, type ReactNode } from "react";
import { panelViews, type PanelViewKey } from "../../types/global-views";

interface CommonPanelContextType {
    setPanelView: (newView: PanelViewKey | null) => void;
    backView: () => void;
    hasPrevView: boolean;
    closePanel: () => void;
}

const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);

export function CommonPanelProvider({ children }: { children: ReactNode }) {
    const [currentPanelView, setCurrentPanelView] = useState<PanelViewKey | null>(null);
    const [previousView, setPreviousView] = useState<PanelViewKey[]>([]);
    const [ open, setOpen ] = useState(true);

    const closePanel = () => {
        setOpen(false);
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
    console.log(previousView);
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
                        fixed left-3 top-20 bottom-5
                        max-w-3/4 min-w-1/4
                        bg-white rounded-2xl
                        z-50 w-fit
                        shadow-lg shadow-gray-600 p-4
                        flex flex-col overflow-auto
                    "
                >
                    <div className="text-bold text-gray-700 flex items-center justify-center h-full">
                        {panelViews[currentPanelView]}
                    </div>
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