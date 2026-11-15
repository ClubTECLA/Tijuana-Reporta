import type { GeneralPreferencesType, localStorageRegistryType, SearchStorageType, SecurityPreferencesType } from "@/types/localStorage-types";

export const GeneralPreferencesBase: GeneralPreferencesType = {
    'dark_mode' : false,
    'show_location_in_searchBar' : false
}

export const SecurityPreferencesBase: SecurityPreferencesType = {
    'remember_in_this_device': false,
    'two_steps_verification': true
}

export const SeachStorageBase: SearchStorageType = {
    recent_searches: [],
    current_location_suggestions: [],
    selected_recent_search: "",
    current_query: "",
}

export const localStorageBaseRegistry: localStorageRegistryType = {
    'Preferencias generales': GeneralPreferencesBase,
    'Preferencias de seguridad': SecurityPreferencesBase,
    'Almacenamiento de Busqueda': SeachStorageBase, 
};

