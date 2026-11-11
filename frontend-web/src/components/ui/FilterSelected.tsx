import { useEffect, useId, useRef, useState } from "react";
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

    const selectedId = value !== undefined ? value : internalId;
    const selectedOption =
        options.find((option) => option.id === selectedId) ?? options[0];

    // Cerrar al hacer click fuera
    useEffect(() => {
        if (!dropdownOpen) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [dropdownOpen]);

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

            {dropdownOpen && (
                <SubSection debug={debug} className="absolute left-0 top-full z-50 mt-2">
                    <OptionsMenu
                        id={menuId}
                        ariaLabel={label}
                        onChangeOption={handleChangeOption}
                        onClose={closeMenu}
                        debug={debug}
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
                </SubSection>
            )}
        </SubSection>
    );
}