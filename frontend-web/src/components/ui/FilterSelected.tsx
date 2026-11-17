import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import SubSection from "@/components/layout/SubSection";
import { cn } from "@/lib/utils";
import { OptionsMenu, OptionsTile, type OptionTileProps } from "./OptionsMenu";

interface FilterSelectedProps {
    label: string;
    options: OptionTileProps[];
    /** Si lo pasas, el componente es controlado por el padre */
    value?: string;
    onChangeOption?: (optionId: string) => void;
    debug?: boolean;
}

export default function FilterSelected({
    label,
    options,
    value,
    onChangeOption,
    debug,
}: FilterSelectedProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [internalId, setInternalId] = useState(
        () => options.find((option) => option.isSelected)?.id ?? options[0]?.id,
    );
    const menuId = useId();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedId = value !== undefined ? value : internalId;
    const selectedOption =
        options.find((option) => option.id === selectedId) ?? options[0];

    // Cerrar al hacer click fuera
    useEffect(() => {
        if (!dropdownOpen) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            const target = event.target as Node;
            if (
                !wrapperRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [dropdownOpen]);

    useLayoutEffect(() => {
        if (!dropdownOpen) return;

        const updatePosition = () => {
            const button = buttonRef.current?.getBoundingClientRect();
            const menu = menuRef.current;
            if (!button || !menu) return;

            const gutter = 8;
            const gap = 8;
            const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
            const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
            const maxWidth = Math.max(0, viewportWidth - gutter * 2);
            menu.style.maxWidth = `${maxWidth}px`;
            const menuHeight = menu.scrollHeight;
            const spaceBelow = Math.max(0, viewportHeight - button.bottom - gap - gutter);
            const spaceAbove = Math.max(0, button.top - gap - gutter);
            const openAbove = menuHeight > spaceBelow && spaceAbove > spaceBelow;
            const availableHeight = openAbove ? spaceAbove : spaceBelow;
            const maxHeight = Math.min(
                Math.max(0, availableHeight),
                Math.max(0, viewportHeight - gutter * 2),
            );
            menu.style.maxHeight = `${maxHeight}px`;
            const menuWidth = menu.getBoundingClientRect().width;
            const visibleHeight = Math.min(menuHeight, maxHeight);
            const preferredTop = openAbove
                ? button.top - gap - visibleHeight
                : button.bottom + gap;
            const top = Math.max(
                gutter,
                Math.min(preferredTop, viewportHeight - gutter - visibleHeight),
            );
            const maxLeft = Math.max(gutter, viewportWidth - gutter - menuWidth);
            const left = Math.min(Math.max(gutter, button.left), maxLeft);

            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
            menu.style.visibility = "visible";
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [dropdownOpen, options.length]);

    const closeMenu = () => {
        setDropdownOpen(false);
        buttonRef.current?.focus();
    };

    const handleChangeOption = (optionId: string) => {
        if (value === undefined) setInternalId(optionId);
        closeMenu();
        onChangeOption?.(optionId);
    };

    return (
        <SubSection ref={wrapperRef} debug={debug} format="both-fit" className="relative">
            <SubSection
                ref={buttonRef}
                as="button"
                debug={debug}
                type="button"
                disabled={options.length === 0}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-controls={dropdownOpen ? menuId : undefined}
                onClick={() => setDropdownOpen((open) => !open)}
                className={cn(
                    "flex h-[50px] items-center gap-2 rounded-full border-2 border-line",
                    "bg-surface px-5 font-ui transition-colors hover:border-line-strong",
                    "focus-visible:outline-2 focus-visible:outline-brand",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                )}
            >
                <SubSection
                    as="span"
                    debug={debug}
                    className="text-caption font-medium tracking-[0.12em] text-ink-muted"
                >
                    {label}
                </SubSection>
                <SubSection as="span" debug={debug} className="text-caption font-bold text-ink">
                    {selectedOption?.title ?? "Seleccionar"}
                </SubSection>
                <IoChevronDown
                    aria-hidden="true"
                    className={cn(
                        "size-6 shrink-0 text-ink-muted transition-transform",
                        dropdownOpen && "rotate-180",
                    )}
                />
            </SubSection>

            {dropdownOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[1000] overflow-x-hidden overflow-y-auto"
                    style={{
                        top: 0,
                        left: 0,
                        width: "max-content",
                        maxWidth: "calc(100vw - 1rem)",
                        maxHeight: "calc(100vh - 1rem)",
                        visibility: "hidden",
                    }}
                >
                    <OptionsMenu
                        id={menuId}
                        ariaLabel={label}
                        onChangeOption={handleChangeOption}
                        onClose={closeMenu}
                        debug={debug}
                        className="w-max min-w-[min(12.5rem,calc(100vw-1rem))] max-w-full"
                    >
                        {options.map((option) => (
                            <OptionsTile
                                key={option.id}
                                {...option}
                                isSelected={option.id === selectedOption?.id}
                                debug={debug || option.debug}
                            />
                        ))}
                    </OptionsMenu>
                </div>,
                document.body,
            )}
        </SubSection>
    );
}