import { isValidElement, cloneElement, Children } from "react";
import { IoIosArrowBack, IoIosClose } from "react-icons/io";
import { useCommonPanel } from "../../../../hooks/contexts/CommonPanelContext";
import { borders, type SectionProps, type subsectionProps, headerButtonColors } from "../../../../types/utils-types";


const arrangementNormalize = {
    toRight: 'justify-start w-full',
    toLeft: 'justify-end w-full',
    center: 'justify-center w-full'
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
        extraHeaderBtns,
        className,
        footerText,
        border
    }: RowSectionProps
) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();
    const borderClasses = `${border?.map((side) => borders[side]).join(' ') ?? ''} ${border ? 'border-gray-200' : ''}`;

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
                                        onClick={btn.onClick}
                                        type='button'
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
                        <span className="text-xs text-gray-500">{footerText}</span>
                    </div>
                }
        </section>
    )
}