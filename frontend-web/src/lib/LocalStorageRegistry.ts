import type { GeneralPreferencesType, localStorageRegistryType, SecurityPreferencesType } from "@/types/localStorage-types";

export const GeneralPreferencesBase: GeneralPreferencesType = {
    'dark_mode' : false,
    'show_location_in_searchBar' : false
}

export const SecurityPreferencesBase: SecurityPreferencesType = {
    'remember_in_this_device': false,
    'two_steps_verification': true
}

export const localStorageBaseRegistry: localStorageRegistryType = {
    'Preferencias generales': GeneralPreferencesBase,
    'Preferencias de seguridad': SecurityPreferencesBase, 
};

