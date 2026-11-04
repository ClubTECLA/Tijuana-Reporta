import { type ReactNode } from "react";

interface PanelFooterProps {
    element?: ReactNode;
}

export default function PanelFooter({ element }: PanelFooterProps) {
    
    if(!element) {
        return null
    }

    if(typeof element === 'string') {
        return(
            <div className={`flex flex-col items-start justify-center p-4 w-full`}>
                <span className="text-xs text-ink-muted">{element}</span>
            </div>
        )
    }

    return(
        <div className="w-full h-fit flex flex-col items-center justify-center">
            {element}
        </div>
    )
}