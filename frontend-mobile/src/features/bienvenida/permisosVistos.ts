import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Las pantallas "Activa tu ubicación" y "Recibe alertas cercanas" se muestran solo la primera vez
// que se abre la app; después se va directo a la Bienvenida.
const CLAVE = 'bienvenida:permisos-vistos';

// En memoria para no releer el almacenamiento (ni parpadear) al volver a la Bienvenida.
let vistos: boolean | null = null;

async function leerPermisosVistos(): Promise<boolean> {
  if (vistos !== null) return vistos;
  // Si el almacenamiento falla, mejor volver a mostrar las pantallas que trabar el arranque.
  vistos = (await AsyncStorage.getItem(CLAVE).catch(() => null)) === 'true';
  return vistos;
}

export async function marcarPermisosVistos(): Promise<void> {
  vistos = true;
  await AsyncStorage.setItem(CLAVE, 'true').catch((err) =>
    console.warn('[bienvenida] no se pudo guardar que ya se vieron los permisos:', err),
  );
}

/** `null` mientras se lee el almacenamiento. */
export function usePermisosVistos(): boolean | null {
  const [valor, setValor] = useState<boolean | null>(vistos);

  useEffect(() => {
    if (valor !== null) return;
    let activo = true;
    void leerPermisosVistos().then((leido) => {
      if (activo) setValor(leido);
    });
    return () => {
      activo = false;
    };
  }, [valor]);

  return valor;
}
