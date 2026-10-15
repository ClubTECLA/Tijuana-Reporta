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
                flex min-w-max shrink-0 flex-row items-center justify-center
                gap-2 whitespace-nowrap rounded-full px-2 py-1
                text-md transition-colors duration-200 
                ${isActive
                    ? "bg-white font-semibold text-slate-900 shadow-sm"
                    : "bg-transparent font-medium text-slate-500 hover:text-slate-700"}
                ${debug ? "outline-2 outline-blue-400" : ""}
                sm:min-w-0 sm:flex-1
            `}
        >
            {tabIcon}
            {tabTitle}
            {tabBadge !== undefined && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-sm">
                    {tabBadge}
                </span>
            )}
        </button>
    )
}

interface SegmentedTabsProps extends subsectionProps {
    children: ReactNode
    defaultTab?: number
}

export function SegmentedTabs({
    format,
    debug,
    children,
    defaultTab = 0,
}: SegmentedTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    validateChildren(children, "SegmentedTabs", [TabItem], "TabItem");

    return(
        <SubSection
            format={format}
            debug={debug}
            className={`
                flex max-w-full rounded-full bg-slate-200 p-2
                mb-3 
                ${format === "row" ? "flex-row max-h-15 w-full overflow-x-auto" : "flex-col w-fit"}
                ${debug ? "outline-2 outline-blue-400" : ""}
            `}
        >
            {Children.map(children, (child, index) => {
                if (!isValidElement<TabItemProps>(child)) {
                    throw new Error("SegmentedTabs only accepts TabItem components as direct children.");
                }

                const tab = child as ReactElement<TabItemProps>;
                const onClick = () => {
                    setActiveTab(index);
                    tab.props.onClick?.();
                };

                return cloneElement(tab, {
                    isActive: activeTab === index,
                    onClick,
                });
            })}
        </SubSection>
    )
}