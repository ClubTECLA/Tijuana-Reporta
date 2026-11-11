import {
    useState,
    useEffect,
    useMemo,
    useCallback,
    type Dispatch,
    type SetStateAction,
} from 'react';
import type { localStorageKeys, localStorageValues } from '@/types/localStorage-types';
import { localStorageBaseRegistry } from '@/lib/LocalStorageRegistry';

/** Nombre del evento interno que notifica cambios de preferencias en esta pestaña. */
const localStorageChangeEvent = 'climAlert:local-storage-change';

/** Datos compartidos al sincronizar una clave entre instancias del hook en la misma pestaña. */
type LocalStorageChangeDetail = {
    /** Clave del registro de preferencias que cambió. */
    key: string;
    /** Valor serializado nuevo, o `null` si la clave se eliminó. */
    value: string | null;
};

/**
 * Convierte el valor guardado desde JSON al tipo asociado a la clave.
 * Si no hay valor o el JSON está dañado, devuelve el valor predeterminado del registro.
 */
function parseValue<K extends localStorageKeys>(key: K, item: string | null): localStorageValues<K> {
    if (item === null) return localStorageBaseRegistry[key];

    try {
      const parsed: unknown = JSON.parse(item);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return localStorageBaseRegistry[key];
      }
      return { ...localStorageBaseRegistry[key], ...parsed } as localStorageValues<K>;
    } catch (error) {
      console.error(`Error reading localStorage for the key "${key}":`, error);
      return localStorageBaseRegistry[key];
    }
}

/** Lee una clave del almacenamiento y usa su valor predeterminado si no se puede leer. */
function readValue<K extends localStorageKeys>(key: K): localStorageValues<K> {
    try {
      return parseValue(key, localStorage.getItem(key));
    } catch (error) {
      console.error(`Error reading localStorage for the key "${key}":`, error);
      return localStorageBaseRegistry[key];
    }
}

/** Identifica los actualizadores funcionales aceptados por los setters de React. */
function isStateUpdater<T>(value: SetStateAction<T>): value is (previousValue: T) => T {
    return typeof value === 'function';
}

/**
 * Mantiene una preferencia sincronizada con `localStorage`.
 *
 * La clave determina el tipo del valor y su valor predeterminado, definidos en
 * `localStorage-types` y `LocalStorageRegistry`. Los cambios se guardan y se
 * notifican a otras instancias del hook en esta pestaña; los cambios hechos en
 * otra pestaña se reciben mediante el evento nativo `storage`.
 *
 * @typeParam K Clave registrada en `localStorageRegistryType`.
 * @param key Clave de preferencia que se leerá y actualizará.
 * @returns Una tupla con el valor actual, su setter compatible con `useState`
 * y una función que elimina la clave y restablece el estado al valor predeterminado.
 *
 * @example
 * const [preferencias, setPreferencias, borrarPreferencias] =
 *   useLocalStorage('Preferencias generales');
 *
 * setPreferencias((actuales) => ({ ...actuales, dark_mode: true }));
 * borrarPreferencias();
 */
export function useLocalStorage<K extends localStorageKeys>(key: K) {
    const [valueForKey, setValueForKey] = useState(() => ({
      key,
      value: readValue(key),
      shouldPersist: false,
    }));

    // Si cambia la clave, lee el valor correspondiente sin reutilizar el estado de la anterior.
    const storedValue = useMemo(
      () => (valueForKey.key === key ? valueForKey.value : readValue(key)),
      [key, valueForKey],
    );

    useEffect(() => {
      if (!valueForKey.shouldPersist) return;

      try {
        const serializedValue = JSON.stringify(storedValue);
        localStorage.setItem(key, serializedValue);
        // El evento nativo `storage` no se dispara en la pestaña que hizo el cambio.
        window.dispatchEvent(new CustomEvent<LocalStorageChangeDetail>(localStorageChangeEvent, {
          detail: { key, value: serializedValue },
        }));
      } catch (error) {
        console.error(`Error saving the key "${key}" in localStorage :`, error);
      }
    }, [key, storedValue, valueForKey.shouldPersist]);

    // Sincroniza instancias del hook en esta pestaña y cambios originados en otras pestañas.
    useEffect(() => {
      const updateValue = (value: string | null) => {
        setValueForKey({
          key,
          value: parseValue(key, value),
          shouldPersist: false,
        });
      };
      const handleLocalStorageChange = (event: Event) => {
        const detail = (event as CustomEvent<LocalStorageChangeDetail>).detail;
        if (detail?.key === key) updateValue(detail.value);
      };
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key) updateValue(event.newValue);
      };

      window.addEventListener(localStorageChangeEvent, handleLocalStorageChange);
      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener(localStorageChangeEvent, handleLocalStorageChange);
        window.removeEventListener('storage', handleStorage);
      };
    }, [key]);

    const setStoredValue: Dispatch<SetStateAction<localStorageValues<K>>> = useCallback(
      (action) => {
        setValueForKey((current) => ({
          key,
          shouldPersist: true,
          value: isStateUpdater(action)
            ? action(current.key === key ? current.value : storedValue)
            : action,
        }));
      },
      [key, storedValue],
    );

    /** Elimina la clave y actualiza las instancias al valor predeterminado sin volver a guardarlo. */
    const removeStoredValue = useCallback(() => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing the key "${key}" from localStorage:`, error);
        return;
      }

      window.dispatchEvent(new CustomEvent<LocalStorageChangeDetail>(localStorageChangeEvent, {
        detail: { key, value: null },
      }));
      setValueForKey({
        key,
        value: localStorageBaseRegistry[key],
        shouldPersist: false,
      });
    }, [key]);

    return [storedValue, setStoredValue, removeStoredValue] as const;
}