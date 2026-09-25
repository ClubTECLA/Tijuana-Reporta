import { useContext, createContext, useEffect, useState, type ReactNode } from "react";

interface CommonPanelContextType {
    setPanelView: (newView: ReactNode | null) => void
}

const CommonPanelContext = createContext<CommonPanelContextType | undefined>(undefined);

export function CommonPanelProvider({children}: {children: ReactNode}) {
    const [ panelView, setPanelView ] = useState<ReactNode | null>(null);
    
    return(
       <CommonPanelContext.Provider 
            value={{
                setPanelView
            }}
        >
            {children}
            <section 
                className="
                    fixed left-3 top-20 
                    bg-white rounded-2xl 
                    z-50 w-fit h-fit
                    shadow-lg shadow-gray-600 p-4    
                "
            >
                {panelView ? 
                    panelView
                :
                    <div className="text-bold text-gray-700 flex items-center justify-center">
                        No hay view seleccionada
                    </div>
                }
            </section>
       </CommonPanelContext.Provider> 
    )
}

export const useCommonPanel = () => {
    const context = useContext(CommonPanelContext);
    if(context === undefined){
        throw new Error('useCommonPanel must be used within an CommonPanelProvider')
    }
    return context;
}