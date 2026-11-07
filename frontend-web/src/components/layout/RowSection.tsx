import { isValidElement, cloneElement, Children } from "react";
import PanelHeader from "./PanelHeader";
import { borders, type SectionProps, type subsectionProps } from "@/types/utils-types";
import PanelFooter from "./PanelFooter";


const arrangementNormalize = {
    toRight: 'justify-start w-full',
    toLeft: 'justify-end w-full',
    center: 'justify-center w-full',
    between: 'justify-between w-full'
} as const satisfies Record<string, string>

interface RowSectionProps extends SectionProps {
    arrangementSubsections?: keyof typeof arrangementNormalize
}

export default function RowSection(
    {
        children, 
        arrangementSubsections = 'toRight', 
        debug = false,
        title,
        subtitle,
        headerActions,
        className,
        footerElement,
        border
    }: RowSectionProps
) {
    const borderClasses = `${border?.map((side) => borders[side]).join(' ') ?? ''} ${border ? 'border-line' : ''}`;
    const sizingClasses = className?.split(/\s+/).filter((className) => {
        const utility = className.split(':').pop() ?? className;
        return /^(?:w-|h-|min-w-|min-h-|max-w-|max-h-|size-|basis-|grow(?:-|$)|shrink(?:-|$)|flex-(?:1|auto|initial|none)$)/.test(utility);
    }).join(' ') ?? '';

    if(!title){
        return(
            <section className={`flex flex-col justify-between ${sizingClasses} ${debug ? 'border-2 border-green-500' : ''} ${borderClasses}`}>
                <div className={`h-full flex flex-row max-h-full max-w-full ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} items-center ${className}`}>
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
        <section className={`w-full h-full flex flex-col max-h-full max-w-full justify-between ${debug ? 'border-2' : ''} ${borderClasses}`}>
            <div className={`w-full h-fit flex flex-col max-h-full max-w-full`}>
                <PanelHeader title={title} subtitle={subtitle} actions={headerActions} />
                <div className={`max-w-full max-h-full flex flex-row mt-5 ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} ${className}`}>
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