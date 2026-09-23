import { CiLocationOn } from 'react-icons/ci';
import { IoSearch } from 'react-icons/io5';

export default function SearchBar() {
    return (
        <div 
            className="
                flex w-full min-w-0 items-center 
                gap-3 rounded-full border border-gray-200 
                bg-white px-2 py-2 shadow-lg shadow-gray-600 
                
            "
        >
            <div
                className="flex shrink-0 items-center justify-center rounded-full bg-blue-600 p-2 text-white"
                aria-hidden="true"
            >
                <CiLocationOn className="text-2xl" />
            </div>

            <IoSearch
                className="shrink-0 text-xl text-gray-400"
                aria-hidden="true"
            />

            <input
                id="searchInput"
                name="search"
                type="search"
                placeholder="Buscar folio, dirección o colonia"
                className="
                min-w-0 flex-1 bg-transparent 
                px-1 text-sm text-gray-700 
                outline-none placeholder:text-gray-400 
                focus-within:border-blue-700"
            />
        </div>
    );
}