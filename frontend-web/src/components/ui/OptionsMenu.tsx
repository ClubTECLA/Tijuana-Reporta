import {
    Children,
    cloneElement,
    isValidElement,
    useEffect,
    useRef,
    type KeyboardEvent,
    type ReactNode,
} from "react";
import SubSection from "@/components/layout/SubSection";
import { cn } from "@/lib/utils";

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
    title,
    icon,
    onClick,
    isSelected = false,
    variant = "default",
    debug,
}: OptionTileProps) {
    const isDanger = variant === "danger";
    const hasIcon = icon != null && icon !== false && icon !== true;

    return (
        <SubSection
            as="button"
            debug={debug}
            type="button"
            role="menuitemradio"
            aria-checked={isSelected}
            tabIndex={-1} // el foco se mueve por código (flechas), no con Tab
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2",
                "text-left font-ui text-body font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]",
                !isSelected && "hover:bg-subtle",
                isDanger
                    ? "text-danger"
                    : isSelected
                        ? "bg-brand-subtle text-brand-text font-semibold"
                        : "text-ink",
            )}
        >
            {hasIcon && (
                <SubSection
                    as="span"
                    debug={debug}
                    className={cn(
                        "size-7 shrink-0 items-center justify-center [&>svg]:size-full",
                        isDanger ? "text-danger" : "text-icon",
                    )}
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
    onClose?: () => void;
    debug?: boolean;
}

const ITEM_SELECTOR = '[role^="menuitem"]';

export function OptionsMenu({
    children,
    id,
    ariaLabel = "Opciones",
    onChangeOption,
    onClose,
    debug,
}: OptionsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Al abrir: foco en la opción seleccionada, o en la primera
    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const target =
            menu.querySelector<HTMLElement>('[aria-checked="true"]') ??
            menu.querySelector<HTMLElement>(ITEM_SELECTOR);
        target?.focus();
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose?.();
            return;
        }

        // Tab: cierra y deja que el navegador siga su camino natural
        if (event.key === "Tab") {
            onClose?.();
            return;
        }

        const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
        );
        if (items.length === 0) return;

        const current = items.indexOf(document.activeElement as HTMLElement);
        let next: number | null = null;

        switch (event.key) {
            case "ArrowDown":
                next = (current + 1) % items.length;
                break;
            case "ArrowUp":
                next = (current - 1 + items.length) % items.length;
                break;
            case "Home":
                next = 0;
                break;
            case "End":
                next = items.length - 1;
                break;
        }

        if (next !== null) {
            event.preventDefault();
            items[next].focus();
        }
    };

    return (
        <SubSection
            ref={menuRef}
            debug={debug}
            id={id}
            role="menu"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            className="flex min-w-50 flex-col rounded-2xl bg-surface p-2 shadow-float"
        >
            {Children.map(children, (child) => {
                if (child == null || typeof child === "boolean") return null;

                if (!isValidElement<OptionTileProps>(child) || child.type !== OptionsTile) {
                    if (import.meta.env.DEV) {
                        console.error("OptionsMenu only accepts OptionsTile as children");
                    }
                    return null;
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