import type { subsectionProps } from "@/types/utils-types";
import SubSection from "@/components/layout/SubSection";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";


interface ItemProps extends Omit<subsectionProps, "format"> {
    format?: subsectionProps["format"]
    icon?: ReactNode | null,
    title: string,
    isSelected: boolean 
    onClick?: () => void
}

export function SideNavItem ({format = "col", debug, icon, title, isSelected, onClick, subKey} : ItemProps) {
    return(
        <SubSection
            format={format}
            debug={debug}
            className={`
                flex-row gap-4 items-center justify-start rounded-2xl
                px-4 ${isSelected ? "text-brand-text bg-brand-subtle" : 'text-ink-muted'} 
                hover:text-brand-text hover:bg-brand-subtle transition-all duration-300
                py-3
            `}
            onClick={onClick}
            as='button'
            subKey={subKey}
        >
            
            <div
                className="text-lg"
            >
                {icon}
            </div>            
            <span 
                className="text-md font-semibold"
            >{title}</span>
        </SubSection>
    )
}

interface SideNavProps extends subsectionProps {
    children: ReactNode
}

export function SideNav({format, debug, children} : SideNavProps) {

    const childrenWithFormat = Children.map(children, (child) => {
        if (!isValidElement<ItemProps>(child)) {
            throw new Error("SideNav only accepts SideNavItem components as direct children.");
        }

        return cloneElement(child, {
            format: child.props.format ?? format,
            debug: debug || child.props.debug
        });
    });

    return(
        <SubSection
            format={format}
            debug={debug}
            className="flex-col gap-2"
        >
            {childrenWithFormat}
        </SubSection>
    )
}