import { Children, cloneElement, isValidElement} from "react";
import { IoIosArrowBack, IoIosClose } from "react-icons/io";
import { useCommonPanel } from "../../../../hooks/contexts/CommonPanelContext";
import { borders, headerButtonColors, type SectionProps, type subsectionProps } from "../../../../types/utils-types";

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
        extraHeaderBtns,
        className,
        footerText,
        border
    }: ColSectionProps
) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();
    
    const brd = `${border?.map((b) => borders[b]).join(' ') ?? ''} border-gray-200`;

    if(!title){
        return(
            <section 
                className={`
                    h-full flex flex-col 
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
            {title && 
                <div className="flex flex-row items-center gap-2">
                    {hasPrevView && 
                        <button 
                            type='button'
                            aria-label="Regresar"
                            onClick={backView}
                            className="
                                flex items-center justify-center 
                                w-10 h-10 rounded-full 
                                bg-gray-200 text-2xl font-bold text-gray-500 
                                hover:bg-gray-100 hover:scale-120 transition-all duration-300 
                            "
                        >
                            <IoIosArrowBack/>
                        </button>
                    }
                    <button 
                        type='button'
                        aria-label="Cerrar"
                        onClick={closePanel}
                        className="
                            flex items-center justify-center 
                            w-10 h-10 rounded-full 
                            bg-gray-200 text-3xl font-bold text-gray-500
                            hover:bg-gray-100 hover:scale-120 transition-all duration-300 
                        "
                    >
                        <IoIosClose/>
                    </button>
                    <div className="flex flex-col items-start pl-4">
                        <span className="text-xl font-bold">{title}</span>
                        {!!subtitle && 
                            <span className="text-sm text-gray-500">{subtitle}</span>
                        }
                    </div>
                    {!!extraHeaderBtns &&
                        <div className="flex flex-row justify-end items-center pl-10 h-full">
                            {extraHeaderBtns.map((btn, idx) => {
                                const style = `${headerButtonColors[btn.color]} text-white font-semibold transition-all duration-100`

                                return (
                                    <button 
                                        key={idx}
                                        type='button'
                                        onClick={btn.onClick}
                                        className={`${style} flex flex-row items-center justify-center gap-2 rounded-4xl px-4 py-1`}
                                    >
                                    {btn.icon}
                                    {btn.title} 
                                    </button>
                                )
                            })}
                        </div>
                    }
                </div>
            }
            <div className={`max-w-full max-h-full w-full mt-5 flex flex-col ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} ${className}`}>
                {Children.map(children, (child) => {
                    if(isValidElement<subsectionProps | SectionProps>(child)){
                        return cloneElement(child, {
                            debug: debug || child.props.debug
                        })
                    }

                    return child;
                })}
                <div className={`flex flex-col items-start justify-center p-4 w-full ${debug ? 'border-2 border-blue-500' : ''}`}>
                    {footerText && <span className="text-xs text-gray-500">{footerText}</span>}
                </div>
            </div>
        </section>
    )
}