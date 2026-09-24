import { CiLocationOn } from 'react-icons/ci';
import { IoSearch } from 'react-icons/io5';

export default function SearchBar() {
    return (
        <form 
            className="
                flex w-full min-w-0 items-center 
                gap-3 rounded-full border border-gray-200 
                bg-white px-2 py-2 shadow-lg shadow-gray-600 
                pr-5
            "
        >
            <div
                className="flex shrink-0 items-center justify-center rounded-full bg-blue-600 p-2 text-white"
                aria-hidden="true"
            >
                <CiLocationOn className="text-2xl" />
            </div>

            <input
                id="searchInput"
                name="search"
                type="search"
                placeholder="Buscar folio, dirección o colonia"
                className="
                min-w-0 flex-1 bg-transparent 
                px-1 text-sm text-gray-700 
                placeholder:text-gray-400 
                focus-within:outline-blue-700
                rounded-full h-full px-4
                "
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
    );
}