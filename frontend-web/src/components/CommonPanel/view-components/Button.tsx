import type { ReactNode } from "react";
import type { subsectionProps } from "../../../types/utils-types";
import SubSection from "../PanelComponents/primitive-components/SubSection";
import { Link } from "react-router-dom";


const buttonWrapped: Record<string, string> = {
    'red' : 'bg-red-500 text-white',
    'green': 'bg-green-500 text-white',
    'yellow': 'bg-yellow-500 text-white',
    'blue': 'bg-blue-600 text-white',
    'gray': 'bg-gray-200 text-black'
};

type wrappedColor = keyof typeof buttonWrapped;

interface buttonProps extends subsectionProps {
    icon?: ReactNode
    title: string;
    color?: wrappedColor
    type?:  "button" | 'link'
    onClick?: () => void
    to?: string 
}

export default function Button({icon, title, format, debug, color = 'gray', onClick, to, type = 'button'} : buttonProps) {
    return(
        <SubSection
            className={`p-1 ${buttonWrapped[color]} flex-row items-center justify-center min-w-30 rounded-3xl group hover:scale-105 transition-transform duration-300 ease-in-out`}
            debug={debug}
            format={format}
        >
            {type === 'link' && to ? 
                <Link
                    to={to} 
                    className={`
                        w-fit h-full ${debug ? 'border-2' : ''}
                        flex flex-row items-center 
                        justify-center gap-2 rounded-2xl
                        hover:scale-105 transition-transform duration-300 ease-in-out
                    `}
                    onClick={onClick}
                >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-md font-bold">{title}</span>
                </Link>
            :
                <button 
                    className={`
                        w-fit h-full ${debug ? 'border-2' : ''}
                        flex flex-row items-center 
                        justify-center gap-2 rounded-2xl
                        hover:scale-105 transition-transform duration-300 ease-in-out
                    `}
                    onClick={onClick}
                >
                    <span className="text-2xl">{icon}</span>
                    <span className="text-md font-bold">{title}</span>
                </button>
            }
        </SubSection>
    )
}