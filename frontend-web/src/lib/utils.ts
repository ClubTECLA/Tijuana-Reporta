import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import type { Dispatch, SetStateAction } from "react";
import type { SearchStorageType } from "@/types/localStorage-types";

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [{ text: ["2xs", "caption", "body", "title"] }], // AQUI SE DEBEN PONER LOS TAMAÑOS PERSONALIZADOS PARA QUE CN LOS ACEPTE
        },
    },
});

const PHOTON_TYPE_LABELS = new Map([
    ["house", "Domicilio"],
    ["street", "Calle"],
    ["locality", "Localidad"],
    ["neighbourhood", "Colonia"],
    ["neighborhood", "Colonia"],
    ["suburb", "Colonia"],
    ["district", "Distrito"],
    ["borough", "Alcaldía"],
    ["city", "Ciudad"],
    ["town", "Pueblo"],
    ["village", "Pueblo"],
    ["hamlet", "Poblado"],
    ["municipality", "Municipio"],
    ["county", "Municipio"],
    ["state", "Estado"],
    ["country", "País"],
    ["postcode", "Código postal"],
    ["other", "Otro"],
]);

export function traducirTipoPhoton(type: unknown): string {
    if (typeof type !== "string" || !type.trim()) return "Lugar";

    return PHOTON_TYPE_LABELS.get(type.trim().toLowerCase()) ?? type;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function hasOwnKey<T extends object>(object: T, key: PropertyKey): key is keyof T {
    return Object.prototype.hasOwnProperty.call(object, key);
}

export const addRecentSearch = (
    query: string,
    setSearchStorage: Dispatch<SetStateAction<SearchStorageType>>,
) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    setSearchStorage((previous) => {
        const recentSearches = previous.recent_searches.filter(
            (recentSearch) => recentSearch.trim().toLocaleLowerCase() !== normalizedQuery.toLocaleLowerCase(),
        );

        return {
            ...previous,
            recent_searches: [normalizedQuery, ...recentSearches].slice(0, 10),
        };
    });
}