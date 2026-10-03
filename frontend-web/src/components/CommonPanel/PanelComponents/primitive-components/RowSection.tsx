import type { ReactNode } from "react";
import { IoIosArrowBack, IoIosClose } from "react-icons/io";
import { useCommonPanel } from "../../../../hooks/contexts/CommonPanelContext";

type arrangementType = 'toRight' | 'toLeft' | 'center'

const arrangementNormalize = {
    toRight: 'justify-start w-full',
    toLeft: 'justify-end w-full',
    center: 'justify-center w-full'
}

const headerButtonColors = {
    green: 'bg-green-500 hover:bg-green-300',
    red: 'bg-red-500 hover:bg-red-300',
    blue: 'bg-blue-500 hover:bg-blue-300'
}

type headerBtnsType = {
    title: string
    icon?: ReactNode
    onClick?: () => void
    color: 'green' | 'red' | 'blue'
}[]

interface SectionProps {
    children: ReactNode,
    arrangementSubsections?: arrangementType
    debug?: boolean
    title?: string
    subtitle?: string
    extraHeaderBtns?: headerBtnsType 
    className?: string
}

export default function RowSection(
    {
        children, 
        arrangementSubsections = 'toRight', 
        debug = false,
        title,
        subtitle,
        extraHeaderBtns,
        className
    }: SectionProps
) {
    const { backView, hasPrevView, closePanel } = useCommonPanel();


    if(!title){
        return(
            <section className={`h-full flex flex-row  ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} items-center ${className}`}>
                {children}
            </section>
        )   
    }

    return(
        <section className={`w-full h-full flex flex-col ${debug ? 'border-2' : ''}`}>
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
            <div className={`h-full flex flex-row mt-5 ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} items-center ${className}`}>
                {children}
            </div>
        </section>
    )
}