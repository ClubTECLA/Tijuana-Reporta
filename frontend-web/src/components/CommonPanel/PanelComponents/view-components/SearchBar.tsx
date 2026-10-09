import { IoSearch } from 'react-icons/io5';
import SubSection from '../primitive-components/SubSection';
import type { subsectionProps } from '../../../../types/utils-types';
import { useState } from 'react';

interface SearchBarProps extends subsectionProps {
    onSubmit?: () => void;
    placeholder?: string;
}

export default function SearchBar({ format, debug, onSubmit, placeholder }: SearchBarProps) {
    const [ searchQuery, setSearchQuery ] = useState<string>("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }
    
    return (
        <SubSection
            format={format}
            debug={debug}
        >
            <form 
                className="
                    flex w-full min-w-0 items-center 
                    gap-3 rounded-full border border-gray-200 
                    bg-white pl-4 pr-2 py-2 
                    pr-5
                "
                onSubmit={onSubmit}
            >
                <input
                    id="searchInput"
                    name="search"
                    type="search"
                    placeholder={placeholder || "Buscar"}
                    className="
                        min-w-0 flex-1 bg-transparent 
                        px-1 text-sm text-gray-700 
                        placeholder:text-gray-400 
                        focus-within:outline-transparent
                        rounded-full h-full
                    "
                    value={searchQuery}
                    onChange={handleChange}
                />

                <button
                    type="submit"
                    className='hover:scale-120 transition-all duration-100 rounded-full hover:bg-gray-800 py-1 px-2 hover:text-white'
                >
                    <IoSearch
                        className="shrink-0 text-xl"
                        aria-hidden="true"
                    />
                </button>
            </form>
        </SubSection>
    );
}