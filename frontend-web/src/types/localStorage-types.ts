export type GeneralPreferencesType = {
    dark_mode: boolean;
    show_location_in_searchBar: boolean;
}

export type SecurityPreferencesType = {
    remember_in_this_device: boolean;
    two_steps_verification: boolean;
}

export type localStorageRegistryType = {
    "Preferencias generales": GeneralPreferencesType;
    "Preferencias de seguridad": SecurityPreferencesType;
};

export type localStorageKeys = keyof localStorageRegistryType;

export type localStorageValues<K extends localStorageKeys> = localStorageRegistryType[K];