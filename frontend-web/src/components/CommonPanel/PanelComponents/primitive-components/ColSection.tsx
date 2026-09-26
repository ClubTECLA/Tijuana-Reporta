import type { ReactNode } from "react";
import { IoIosArrowBack } from "react-icons/io";

type arrangementType = 'toUp' | 'toDown' | 'center'

const arrangementNormalize = {
    toDown: 'justify-start h-fit',
    toUp: 'justify-end h-full',
    center: 'justify-center h-full'
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
    title: string
    subtitle?: string
    extraHeaderBtns?: headerBtnsType 
}

export default function ColSection(
    {
        children, 
        arrangementSubsections = 'toDown', 
        debug = false,
        title,
        subtitle,
        extraHeaderBtns
    }: SectionProps
) {
    
    return(
        <section className={`w-fit h-full flex flex-col ${!!debug ? 'border-2' : ''}`}>
            <div className="flex flex-row items-center">
                <button 
                    className="
                        flex items-center justify-center 
                        w-10 h-10 rounded-full 
                        bg-gray-100 text-2xl font-bold text-gray-500 
                    "
                >
                    <IoIosArrowBack/>
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
            <div className={`w-full mt-5 flex flex-col ${debug ? 'border-2 border-red-500' : ''} ${arrangementNormalize[arrangementSubsections]} items-center`}>
                {children}
            </div>
        </section>
    )
}