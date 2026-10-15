import { type ReactNode, isValidElement, cloneElement, Children } from "react";
import { subsectionFormats, type subsectionProps } from "../../../../types/utils-types";
import { Link } from "react-router-dom";

interface generalSubsectionProps extends subsectionProps{
    children?: ReactNode
    className?: string
    type?: "div" | "button" | 'link' 
    onClick?: () => void
    to?: string
}

function cloneWithDebug(child: ReactNode, debug?: boolean): ReactNode {
    if (!isValidElement<subsectionProps>(child) || typeof child.type === "string") {
        return child;
    }

    return cloneElement(child, {
        debug: debug || child.props.debug,
    });
}

export default function SubSection({children, className, debug, format='nothing', type='div', onClick, to, subKey}: generalSubsectionProps){
    
    const frt = subsectionFormats[format];

    if(type === 'link' && to){
        return(
            <Link 
                className={`
                    flex  ${frt} 
                    ${className ?? ''}  ${debug ? 'border-2 border-blue-400' : ''}
                `}
                to={to}
                key={subKey}
            >
                {Children.map(children, (child) => {
                    return cloneWithDebug(child, debug)
                })}
            </Link>
        )
    }

    if(type === 'button'){
        return(
            <button
                className={`
                    flex  ${frt} 
                    ${className ?? ''}  ${debug ? 'border-2 border-blue-400' : ''}
                `}
                type='button'
                onClick={onClick}
                key={subKey}
            >
                {Children.map(children, (child) => {
                    return cloneWithDebug(child, debug)
                })}
            </button>
        )
    }

    return(
        <div 
            className={`
                flex  ${frt} ${className ?? ''} 
                 ${debug ? 'border-2 border-blue-400' : ''}
            `}
            key={subKey}
        >
            {Children.map(children, (child) => {
                return cloneWithDebug(child, debug)
            })}
        </div>
    )
}