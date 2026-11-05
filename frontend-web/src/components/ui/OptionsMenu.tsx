import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import SubSection from "@/components/layout/SubSection";

export interface OptionTileProps {
    id: string;
    title: string;
    icon?: ReactNode;
    onClick?: () => void;
    isSelected?: boolean;
    variant?: "default" | "danger";
    debug?: boolean;
}

export function OptionsTile({
    id,
    title,
    icon,
    onClick,
    isSelected = false,
    variant = "default",
    debug,
}: OptionTileProps) {
    const tone = variant === "danger"
        ? "text-danger"
        : isSelected
            ? "bg-brand-subtle text-brand-text font-semibold"
            : "text-ink";
    const iconTone = variant === "danger" ? "text-danger" : "text-icon";

    return (
        <SubSection
            as="button"
            debug={debug}
            id={id}
            type="button"
            role="menuitem"
            aria-checked={isSelected}
            onClick={onClick}
            className={`
                flex items-center gap-4 rounded-xl px-3 py-2
                text-left font-ui text-body font-medium transition-colors
                ${isSelected ? "" : "hover:bg-subtle"}
                focus-visible:outline-2 focus-visible:outline-brand
                focus-visible:outline-offset-[-2px]
                ${tone}
            `}
        >
            {icon != null && (
                <SubSection
                    as="span"
                    debug={debug}
                    className={`size-7 shrink-0 items-center justify-center [&>svg]:size-full ${iconTone}`}
                >
                    {icon}
                </SubSection>
            )}
            <SubSection as="span" debug={debug} className="text-body">
                {title}
            </SubSection>
        </SubSection>
    );
}

interface OptionsMenuProps {
    children: ReactNode;
    id?: string;
    ariaLabel?: string;
    onChangeOption?: (optionId: string) => void;
    debug?: boolean;
}

export function OptionsMenu({
    children,
    id,
    ariaLabel = "Opciones",
    onChangeOption,
    debug,
}: OptionsMenuProps) {
    return (
        <SubSection
            debug={debug}
            id={id}
            role="menu"
            aria-label={ariaLabel}
            className="
                flex min-w-50 flex-col
                rounded-2xl bg-surface p-2 shadow-float
            "
        >
            {Children.map(children, (child) => {
                if (!isValidElement<OptionTileProps>(child) || child.type !== OptionsTile) {
                    throw new Error("OptionsMenu only accepts OptionsTile as children");
                }

                return cloneElement(child, {
                    debug: debug || child.props.debug,
                    onClick: () => {
                        child.props.onClick?.();
                        onChangeOption?.(child.props.id);
                    },
                });
            })}
        </SubSection>
    );
}
