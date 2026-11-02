import { useRef, useState, type ChangeEvent, type FocusEvent } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';

interface SearchBarProps {
    onChangeQuery?: (query: string) => void;
    onSubmit?: (query: string) => void;
}

export default function SearchBar({onChangeQuery, onSubmit}: SearchBarProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    const isActive = focused;

    const handleBlur = (e: FocusEvent<HTMLFormElement>) => {
        // Pasar el foco del input a los botones de la barra no la saca del estado Enfoque.
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
    };

    const handleChangeQuery = (e: ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onChangeQuery?.(newQuery);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit?.(query);
    }

    const exit = () => {
        setQuery('');
        inputRef.current?.blur();
        setFocused(false);
    };

    const sideButtonStyle = `
        flex size-11 shrink-1 items-center justify-center
        rounded-full text-xl text-icon
    `;

    return (
        <form 
            role="search"
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            className={`
                flex h-14 w-full max-w-110 min-w-0 items-center gap-3
                rounded-full border-2 bg-white
                font-ui
                shadow-float
                transition-colors duration-200
                ${isActive ? 'border-brand px-2' : 'border-transparent px-7.5'}
            `}
            onSubmit={handleSubmit}
        >
            <input
                ref={inputRef}
                id="searchInput"
                name="search"
                type="search"
                aria-label="Buscar folio, dirección o colonia"
                placeholder="Buscar folio, dirección o colonia"
                value={query}
                onChange={handleChangeQuery}
                className="
                    min-w-0 flex-1 bg-transparent
                    text-[17px] text-ink placeholder:text-ink-muted
                    outline-none
                    [&::-webkit-search-cancel-button]:appearance-none
                "
            />

            <button type="submit" aria-label="Buscar" onMouseDown={(e) => e.preventDefault()} className={`${sideButtonStyle} -mr-3 transition-colors duration-200 hover:bg-subtle`}>
                    <LuSearch aria-hidden="true" />
            </button>

            {isActive &&
                <button type="button" onClick={exit} aria-label="Salir de la búsqueda" className={`${sideButtonStyle} bg-canvas`}>
                    <LuX />
                </button>
            }
        </form>
    );
}