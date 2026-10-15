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

interface BaseButtonProps extends subsectionProps {
    icon?: ReactNode
    title?: string;
    color?: wrappedColor
    onClick?: () => void
    ariaLabel?: string
}

type buttonProps = BaseButtonProps & (
    | { type?: "button"; to?: never }
    | { type: "link"; to: string }
);

export default function Button({
    icon,
    ariaLabel = "Button",
    title,
    format,
    debug,
    color = "gray",
    onClick,
    to,
    type = "button",
}: buttonProps) {
    const className = `
        ${buttonWrapped[color]}
        ${debug ? "border-2" : ""}
        flex flex-row items-center
        justify-center gap-2 rounded-3xl
        hover:scale-105 transition-transform duration-300 ease-in-out
        p-2
    `;
    const content = (
        <>
            {icon != null && <span className="text-2xl">{icon}</span>}
            {title && <span className="text-md font-bold whitespace-nowrap">{title}</span>}
        </>
    );
    const commonProps = { debug, format, className, onClick, ariaLabel };

    if (type === "link" && to) {
        return (
            <SubSection as="link" {...commonProps} to={to}>
                {content}
            </SubSection>
        );
    }

    return (
        <SubSection as="button" {...commonProps}>
            {content}
        </SubSection>
    );
}