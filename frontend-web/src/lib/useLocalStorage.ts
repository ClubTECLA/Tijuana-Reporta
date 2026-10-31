import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';

function readValue<T>(key: string, initialValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage for the key "${key}":`, error);
    return initialValue;
  }
}

function isStateUpdater<T>(value: SetStateAction<T>): value is (previousValue: T) => T {
  return typeof value === 'function';
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [valueForKey, setValueForKey] = useState(() => ({
    key,
    value: readValue(key, initialValue),
  }));
  const storedValue = useMemo(
    () => (valueForKey.key === key ? valueForKey.value : readValue(key, initialValue)),
    [key, initialValue, valueForKey],
  );

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving the key "${key}" in localStorage :`, error);
    }
  }, [key, storedValue]);

  const setStoredValue: Dispatch<SetStateAction<T>> = useCallback(
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