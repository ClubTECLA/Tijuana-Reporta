import { env } from './env';
import { useSessionStore } from './session';

// Sin respuesta en este tiempo se da la petición por perdida: sin esto, una red que "conecta"
// pero no entrega (señal débil, wifi con portal cautivo) deja la pantalla cargando para siempre.
const TIEMPO_LIMITE_MS = 15_000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** La petición no llegó al servidor (sin internet, servidor caído o tiempo agotado). */
export class ErrorRed extends Error {
  constructor(message = 'No hay conexión con el servidor.') {
    super(message);
    this.name = 'ErrorRed';
  }
}

/** `fetch` que convierte los fallos de red y el tiempo agotado en `ErrorRed`. */
export async function fetchConRed(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIEMPO_LIMITE_MS);
  // La señal del llamador también cancela, sin quitarle el tiempo límite a la petición.
  const delLlamador = init.signal;
  const cancelar = () => controller.abort();
  if (delLlamador?.aborted) controller.abort();
  else delLlamador?.addEventListener('abort', cancelar);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    // Cancelación pedida por el llamador: no es un fallo de red.
    if (delLlamador?.aborted) throw err;
    // `fetch` solo rechaza cuando no hubo respuesta: los errores HTTP llegan como `response.ok === false`.
    throw new ErrorRed();
  } finally {
    clearTimeout(timer);
    delLlamador?.removeEventListener('abort', cancelar);
  }
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useSessionStore.getState().token;

  const response = await fetchConRed(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(response.status, body?.message ?? `HTTP ${response.status}`);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
