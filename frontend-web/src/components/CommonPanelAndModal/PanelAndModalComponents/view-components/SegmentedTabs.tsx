import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import type { subsectionProps } from "../../../../types/utils-types";
import { validateChildren } from "./validateChildren";
import SubSection from "../primitive-components/SubSection";

interface TabItemProps extends Omit<subsectionProps, "format"> {
    format?: subsectionProps["format"]
    tabTitle: string
    tabBadge?: string | number
    tabIcon?: ReactNode
    onClick?: () => void
    isActive?: boolean
}

export function TabItem({
    debug, tabTitle, tabBadge, tabIcon, onClick, isActive = false
}: TabItemProps) {
    return(
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={onClick}
            className={`
                flex h-10 min-w-max shrink-0 flex-row items-center justify-center
                gap-1.5 whitespace-nowrap rounded-full px-4
                text-[15px] transition-colors duration-200
                ${isActive
                    ? "bg-white font-semibold text-ink drop-shadow-card"
                    : "bg-transparent font-medium text-ink-muted hover:text-icon"}
                ${debug ? "outline-2 outline-blue-400" : ""}
                sm:min-w-0 sm:flex-auto
            `}
        >
            {tabIcon}
            {tabTitle}
            {tabBadge !== undefined && (
                <span className="min-w-5 rounded-full bg-subtle px-1.5 py-px text-center text-xs font-semibold">
                    {tabBadge}
                </span>
            )}
        </button>
    )
}

interface SegmentedTabsProps extends subsectionProps {
    children: ReactNode
    /** Pestaña inicial cuando el componente guarda la selección por su cuenta. */
    defaultTab?: number
    /** Pestaña activa controlada desde fuera (p. ej. un filtro compartido); con ella no se guarda estado interno. */
    activeTab?: number
    onChange?: (index: number) => void
}

// Pestañas segmentadas del Figma ("Activos · Resueltos · Todos"): fondo canvas y la activa en blanco.

export function SegmentedTabs({
    format,
    debug,
    children,
    defaultTab = 0,
    activeTab,
    onChange,
    className,
}: SegmentedTabsProps) {
    const [internalTab, setInternalTab] = useState(defaultTab);
    const currentTab = activeTab ?? internalTab;
    validateChildren(children, "SegmentedTabs", [TabItem], "TabItem");

    return(
        // format solo decide la orientación: la altura la marca el propio componente (h-fit).
        <SubSection
            format="nothing"
            debug={debug}
            role="tablist"
            className={`
                flex max-w-full gap-1 rounded-full bg-canvas p-1
                ${format === "row" ? "h-fit w-full flex-row overflow-x-auto" : "h-fit w-fit flex-col"}
                ${className ?? ""}
                ${debug ? "outline-2 outline-blue-400" : ""}
            `}
        >
            {Children.map(children, (child, index) => {
                if (!isValidElement<TabItemProps>(child)) {
                    throw new Error("SegmentedTabs only accepts TabItem components as direct children.");
                }

                const tab = child as ReactElement<TabItemProps>;
                const onClick = () => {
                    setInternalTab(index);
                    onChange?.(index);
                    tab.props.onClick?.();
                };

                return cloneElement(tab, {
                    isActive: currentTab === index,
                    onClick,
                });
            })}
        </SubSection>
    )
}