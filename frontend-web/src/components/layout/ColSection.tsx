import { Children, cloneElement, isValidElement} from "react";
import PanelHeader from "./PanelHeader";
import { borders, type SectionProps, type subsectionProps } from "@/types/utils-types";
import PanelFooter from "./PanelFooter";

const arrangementNormalize = {
    toDown: 'justify-start h-fit',
    toUp: 'justify-end h-full',
    center: 'justify-center h-full',
    between: 'justify-between h-full'
} as const satisfies Record<string, string>


interface ColSectionProps extends SectionProps {
    arrangementSubsections?: keyof typeof arrangementNormalize
}

export default function ColSection(
    {
        children, 
        arrangementSubsections = 'toDown', 
        debug = false,
        title,
        subtitle,
        headerActions,
        className,
        footerElement,
        border
    }: ColSectionProps
) {
    const brd = `${border?.map((b) => borders[b]).join(' ') ?? ''} border-line`;
    const sizingClasses = className?.split(/\s+/).filter((className) => {
        const utility = className.split(':').pop() ?? className;
        return /^(?:w-|h-|min-w-|min-h-|max-w-|max-h-|size-|basis-|grow(?:-|$)|shrink(?:-|$)|flex-(?:1|auto|initial|none)$)/.test(utility);
    }).join(' ') ?? '';

    if(!title){
        return(
            <section className={`flex flex-col justify-between ${sizingClasses} ${debug ? "border-2" : ""}`}>
                <div 
                    className={`
                        flex flex-col max-w-full max-h-full
                        ${debug ? 'border-2 border-red-500' : ''} 
                        ${arrangementNormalize[arrangementSubsections]} 
                        items-center ${className}
                        ${border ? brd : ''}     
                    `}
                >
                        {Children.map(children, (child) => {
                            if(isValidElement<subsectionProps | SectionProps>(child)){
                                return cloneElement(child, {
                                    debug: debug || child.props.debug
                                })
                            }

                            return child;
                        })}
                </div>
                <div className={debug ? 'border-2 border-blue-500' : ''}>
                    <PanelFooter element={footerElement}/>
                </div>
            </section>
        )   
    }

    return(
        <section className={`
                w-fit h-full flex flex-col max-h-full max-w-full justify-between
                ${debug ? 'border-2' : ''}
                ${border ? brd : ''}     
            `}
        >
            <div className={`w-fit h-full flex flex-col max-h-full max-w-full ${debug ? "border-2 border-green-500" : ""}`}>
                <PanelHeader title={title} subtitle={subtitle} actions={headerActions} />
                <div className={`max-w-full max-h-full mt-5 flex flex-col ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} ${className}`}>
                    {Children.map(children, (child) => {
                        if(isValidElement<subsectionProps | SectionProps>(child)){
                            return cloneElement(child, {
                                debug: debug || child.props.debug
                            })
                        }

                        return child;
                    })}
                </div>
            </div>
            <div className={debug ? 'border-2 border-blue-500' : ''}>
                <PanelFooter element={footerElement}/>            
            </div>
        </section>
    )
}