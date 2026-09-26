import type { ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";

interface generalSubsectionProps extends subsectionProps{
    children: ReactNode
    className: string
}

export default function SubSection({children, className, debug}: generalSubsectionProps){
    return(
        <div className={`flex flex-1 w-fit h-fit p-2 ${className} ${debug ? 'border-2 border-blue-400' : ''}`}>
            {children}
        </div>
    )
}