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

function readValue<K extends localStorageKeys>(key: K): localStorageValues<K> {
  const defaultValue = localStorageBaseRegistry[key];

  try {
    const item = localStorage.getItem(key);
    return item === null ? defaultValue : (JSON.parse(item) as localStorageValues<K>);
  } catch (error) {
    console.error(`Error reading localStorage for the key "${key}":`, error);
    return defaultValue;
  }
}

function isStateUpdater<T>(value: SetStateAction<T>): value is (previousValue: T) => T {
  return typeof value === 'function';
}

export function useLocalStorage<K extends localStorageKeys>(key: K) {
  const [valueForKey, setValueForKey] = useState(() => ({
    key,
    value: readValue(key),
  }));
  
  const storedValue = useMemo(
    () => (valueForKey.key === key ? valueForKey.value : readValue(key)),
    [key, valueForKey],
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving the key "${key}" in localStorage :`, error);
    }
  }, [key, storedValue]);

  const setStoredValue: Dispatch<SetStateAction<localStorageValues<K>>> = useCallback(
    (action) => {
      setValueForKey((current) => ({
        key,
        value: isStateUpdater(action)
          ? action(current.key === key ? current.value : storedValue)
          : action,
      }));
    },
    [key, storedValue],
  );

  return [storedValue, setStoredValue] as const;
}