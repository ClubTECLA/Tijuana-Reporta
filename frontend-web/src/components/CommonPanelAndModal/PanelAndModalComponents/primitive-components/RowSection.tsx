import { isValidElement, cloneElement, Children } from "react";
import PanelHeader from "./PanelHeader";
import { borders, type SectionProps, type subsectionProps } from "../../../../types/utils-types";


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
        footerText,
        border
    }: RowSectionProps
) {
    const borderClasses = `${border?.map((side) => borders[side]).join(' ') ?? ''} ${border ? 'border-line' : ''}`;

    if(!title){
        return(
            <section className={`${className} flex flex-row  ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} items-center  ${borderClasses}`}>
                {Children.map(children, (child) => {
                    if(isValidElement<subsectionProps | SectionProps>(child)){
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }

                    return child;
                })}
            </section>
        )   
    }

    return(
        <section className={`w-full h-full flex flex-col max-h-full max-w-full ${debug ? 'border-2' : ''} ${borderClasses}`}>
            <PanelHeader title={title} subtitle={subtitle} actions={headerActions} />
            <div className={`${className} max-w-full max-h-full flex flex-row mt-5 ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} ${borderClasses}`}>
                {Children.map(children, (child) => {
                    if(isValidElement<subsectionProps | SectionProps>(child)){
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }
                
                    return child;
                })}
            </div>
            {footerText && 
                    <div className={`flex flex-col items-start justify-center p-4 w-full ${debug ? 'border-2 border-blue-500' : ''}`}>
                        <span className="text-xs text-ink-muted">{footerText}</span>
                    </div>
                }
        </section>
    )
}