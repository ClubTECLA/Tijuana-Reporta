import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { useLocalStorage } from "./useLocalStorage";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [{ text: ["2xs", "caption", "body", "title"] }], // AQUI SE DEBEN PONER LOS TAMAÑOS PERSONALIZADOS PARA QUE CN LOS ACEPTE
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function hasOwnKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
    return Object.prototype.hasOwnProperty.call(object, key);
}

export const addRecentSearch = (query: string) => {
    const [ , setSearchStorage ] = useLocalStorage('Almacenamiento de Busqueda');

    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    setSearchStorage((previous) => {
        const recentSearches = previous.recent_searches.filter(
            (recentSearch) => recentSearch.trim().toLocaleLowerCase() !== normalizedQuery.toLocaleLowerCase(),
        );

        return {
            ...previous,
            recent_searches: [normalizedQuery, ...recentSearches].slice(-10),
        };
    });
}