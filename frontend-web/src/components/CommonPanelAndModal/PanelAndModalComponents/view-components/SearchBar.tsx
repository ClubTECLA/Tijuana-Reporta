import { useState, type SubmitEvent } from 'react';
import { LuSearch } from 'react-icons/lu';
import SubSection from '../primitive-components/SubSection';
import type { subsectionProps } from '../../../../types/utils-types';

interface SearchBarProps extends subsectionProps {
    /** Se llama al pulsar Enter o la lupa, con el texto escrito. */
    onSubmit?: (value: string) => void;
    /** Texto controlado desde fuera; sin él, el componente guarda lo escrito. */
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    /** id del input, para asociarle un <label htmlFor>. */
    inputId?: string;
    ariaLabel?: string;
}

// "Web/Campo · Búsqueda" del Figma: 44 px de alto, borde que se pinta de azul al enfocar y lupa a la derecha.
export default function SearchBar({ format, debug, onSubmit, value, onChange, placeholder, inputId, ariaLabel, className }: SearchBarProps) {
    const [ internalValue, setInternalValue ] = useState<string>("");
    const currentValue = value ?? internalValue;

    const handleChange = (next: string) => {
        setInternalValue(next);
        onChange?.(next);
    }

    const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit?.(currentValue);
    }

    return (
        <SubSection
            format={format}
            debug={debug}
            className={className}
        >
            <form
                role="search"
                className="
                    flex h-11 w-full min-w-0 items-center gap-3
                    rounded-[31px] border border-line bg-surface px-3
                    transition-colors focus-within:border-brand
                "
                onSubmit={handleSubmit}
            >
                <input
                    id={inputId}
                    name="search"
                    type="search"
                    placeholder={placeholder || "Buscar"}
                    aria-label={ariaLabel ?? placeholder ?? "Buscar"}
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                    value={currentValue}
                    onChange={(e) => handleChange(e.target.value)}
                />
                <button type="submit" aria-label="Buscar" className="shrink-0 text-icon transition-colors hover:text-brand">
                    <LuSearch className="size-5" aria-hidden="true" />
                </button>
            </form>
        </SubSection>
    );
}
