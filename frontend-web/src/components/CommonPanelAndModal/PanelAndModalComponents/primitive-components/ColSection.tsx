import { Children, cloneElement, isValidElement} from "react";
import PanelHeader from "./PanelHeader";
import { borders, type SectionProps, type subsectionProps } from "../../../../types/utils-types";

const arrangementNormalize = {
    toDown: 'justify-start h-fit',
    toUp: 'justify-end h-full',
    center: 'justify-center h-full'
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
        footerText,
        border
    }: ColSectionProps
) {
    const brd = `${border?.map((b) => borders[b]).join(' ') ?? ''} border-line`;

    if(!title){
        return(
            <section 
                className={`
                    flex flex-col max-w-full max-h-full
                    ${debug ? 'border-2 border-red-500' : ''} 
                    ${arrangementNormalize[arrangementSubsections]} 
                    items-center ${className}
                    ${border ? brd : ''}     
                `}>
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
        <section className={`
                w-fit h-full flex flex-col max-h-full max-w-full
                ${debug ? 'border-2' : ''}
                ${border ? brd : ''}     
            `}
        >
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
                {footerText &&
                    <div className={`flex flex-col items-start justify-center p-4 w-full ${debug ? 'border-2 border-blue-500' : ''}`}>
                        <span className="text-xs text-ink-muted">{footerText}</span>
                    </div>
                }
            </div>
        </section>
    )
}