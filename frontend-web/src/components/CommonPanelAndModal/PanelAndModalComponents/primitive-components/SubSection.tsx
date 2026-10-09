import { type ReactNode, isValidElement, cloneElement, Children } from "react";
import { subsectionFormats, type subsectionProps } from "../../../../types/utils-types";
import { Link } from "react-router-dom";

interface generalSubsectionProps extends subsectionProps{
    children: ReactNode
    className?: string
    type?: "div" | "button" | 'link' 
    onClick?: () => void
    to?: string
}

export default function SubSection({children, className, debug, format='both-fit', type='div', onClick, to, subKey}: generalSubsectionProps){
    
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
                    if(isValidElement<subsectionProps>(child)){
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }
                
                    return child;
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
                onClick={onClick}
                key={subKey}
            >
                {Children.map(children, (child) => {
                    if(isValidElement<subsectionProps>(child)){
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }
                
                    return child;
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
                if(isValidElement<subsectionProps>(child)){
                    return cloneElement(child, {
                        debug: debug || child.props.debug
                    })
                }
            
                return child;
            })}
        </div>
    )
}