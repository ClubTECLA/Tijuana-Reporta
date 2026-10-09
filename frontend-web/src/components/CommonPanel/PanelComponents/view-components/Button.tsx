import type { ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import SubSection from "../primitive-components/SubSection";


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
            debug={debug}
            format={format}
            className={`
                ${buttonWrapped[color]}
                ${debug ? 'border-2' : ''}
                flex flex-row items-center pr-4
                justify-center gap-2 rounded-3xl
                hover:scale-105 transition-transform duration-300 ease-in-out
                p-2
                `}
            type={type}
            onClick={onClick}
            to={to} 
        >
            <span className="text-2xl">{icon}</span>
            <span className="text-md font-bold whitespace-nowrap">{title}</span>
        </SubSection>
    )
}