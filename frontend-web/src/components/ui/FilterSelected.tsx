import { useEffect, useId, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import SubSection from "@/components/layout/SubSection";
import { OptionsMenu, OptionsTile, type OptionTileProps } from "./OptionsMenu";

interface FilterSelectedProps {
    label: string;
    options: OptionTileProps[];
    onChangeOption?: (optionId: string) => void;
    debug?: boolean;
}

export default function FilterSelected({
    label,
    options,
    onChangeOption,
    debug,
}: FilterSelectedProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState(
        () => options.find((option) => option.isSelected)?.id ?? options[0]?.id,
    );
    const menuId = useId();
    const selectedOption = options.find((option) => option.id === selectedOptionId)
        ?? options.find((option) => option.isSelected)
        ?? options[0];

    useEffect(() => {
        if (!dropdownOpen) return;

        const closeOnOutsideClick = (event: PointerEvent) => {
            if (
                !(event.target instanceof Element)
                || event.target.closest("[data-filter-selected]")?.getAttribute("data-filter-selected") !== menuId
            ) {
                setDropdownOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setDropdownOpen(false);
        };

        document.addEventListener("pointerdown", closeOnOutsideClick);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [dropdownOpen, menuId]);

    const handleChangeOption = (optionId: string) => {
        setSelectedOptionId(optionId);
        setDropdownOpen(false);
        onChangeOption?.(optionId);
    };

    return (
        <SubSection
            debug={debug}
            format="both-fit"
            data-filter-selected={menuId}
            className="relative"
        >
            <SubSection
                as="button"
                debug={debug}
                type="button"
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-controls={menuId}
                onClick={() => setDropdownOpen((open) => !open)}
                className="
                    flex h-[50px] items-center gap-2 rounded-full border-2 border-line
                    bg-white px-5 font-ui transition-colors hover:border-line-strong
                    focus-visible:outline-2 focus-visible:outline-brand
                "
            >
                <SubSection
                    as="span"
                    debug={debug}
                    className="text-md font-medium tracking-[0.12em] text-ink-muted"
                >
                    {label}
                </SubSection>
                <SubSection as="span" debug={debug} className="text-md font-bold text-ink">
                    {selectedOption?.title ?? "Seleccionar"}
                </SubSection>
                <IoChevronDown
                    aria-hidden="true"
                    className={`size-6 shrink-0 text-ink-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
            </SubSection>

            {dropdownOpen && (
                <SubSection
                    debug={debug}
                    className="absolute left-0 top-full z-50 mt-2"
                >
                    <OptionsMenu
                        id={menuId}
                        ariaLabel={label}
                        onChangeOption={handleChangeOption}
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
