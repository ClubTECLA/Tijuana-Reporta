import { useRef, useState, type FocusEvent } from 'react';
import { LuSearch, LuX } from 'react-icons/lu';

export default function SearchBar() {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);

    const isActive = focused;

    const handleBlur = (e: FocusEvent<HTMLFormElement>) => {
        // Pasar el foco del input a los botones de la barra no la saca del estado Enfoque.
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
    };

    const exit = () => {
        setQuery('');
        inputRef.current?.blur();
        setFocused(false);
    };

    const sideButtonStyle = `
        flex size-11 shrink-1 items-center justify-center
        rounded-full text-xl text-slate-700
    `;

    return (
        <form 
            role="search"
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            className={`
                flex h-14 w-full max-w-110 min-w-0 items-center gap-3
                rounded-full border-2 bg-white
                font-['Inter',sans-serif]
                shadow-[0_6px_18px_-4px_rgba(0,0,0,0.12)]
                transition-colors duration-200
                ${isActive ? 'border-[#2677e6] px-2' : 'border-transparent px-7.5'}
            `}
        >
            <input
                ref={inputRef}
                id="searchInput"
                name="search"
                type="search"
                aria-label="Buscar folio, dirección o colonia"
                placeholder="Buscar folio, dirección o colonia"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="
                    min-w-0 flex-1 bg-transparent
                    text-[17px] text-[#111827] placeholder:text-[#64748b]
                    outline-none
                    [&::-webkit-search-cancel-button]:appearance-none
                "
            />

            <button type="submit" aria-label="Buscar" onMouseDown={(e) => e.preventDefault()} className={`${sideButtonStyle} -mr-3 transition-colors duration-200 hover:bg-slate-100`}>
                    <LuSearch aria-hidden="true" />
            </button>

            {isActive &&
                <button type="button" onClick={exit} aria-label="Salir de la búsqueda" className={`${sideButtonStyle} bg-[#e8edf3]`}>
                    <LuX />
                </button>
            }
        </form>
    );
}