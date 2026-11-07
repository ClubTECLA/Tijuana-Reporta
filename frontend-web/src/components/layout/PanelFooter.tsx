import { type ReactNode } from "react";

interface PanelFooterProps {
    element?: ReactNode;
}

export default function PanelFooter({ element }: PanelFooterProps) {
    
    if (element === null || element === undefined || element === false || element === "") {
        return null;
    }

    if (typeof element === 'string' || typeof element === 'number') {
        return(
            <div className={"flex flex-col items-start justify-center p-4 w-full"}>
                <span className="text-caption text-ink-muted">{element}</span>
            </div>
        )
    }

    return(
        <div className="w-full h-fit flex flex-col items-center justify-center">
            {element}
        </div>
    )
}