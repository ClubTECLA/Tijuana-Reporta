import type { PhotonFeature } from "@/lib/usePhotonSearch";

export type GeneralPreferencesType = {
    dark_mode: boolean;
    show_location_in_searchBar: boolean;
}

export type SecurityPreferencesType = {
    remember_in_this_device: boolean;
    two_steps_verification: boolean;
}

export type SearchStorageType = {
    recent_searches: string[];
    current_location_suggestions: PhotonFeature[];
    selected_recent_search: string;
    current_query: string;
}

export type localStorageRegistryType = {
    "Preferencias generales": GeneralPreferencesType;
    "Preferencias de seguridad": SecurityPreferencesType;
    "Almacenamiento de Busqueda": SearchStorageType;
};

export type localStorageKeys = keyof localStorageRegistryType;

export type localStorageValues<K extends localStorageKeys> = localStorageRegistryType[K];